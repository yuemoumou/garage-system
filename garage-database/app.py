from flask import Flask, request, jsonify, session
from flask_cors import CORS
import mysql.connector
from datetime import datetime
import functools

app = Flask(__name__)
app.secret_key = 'parking_secret_2024'
CORS(app, supports_credentials=True)

# ─── 数据库连接 ─────────────────────────────────────────────
def get_db():
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='123456',   # ← 改成你自己的密码
        database='parking_db'
    )

# ─── 登录验证装饰器 ──────────────────────────────────────────
def login_required(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        if 'admin_id' not in session:
            return jsonify({'code': 401, 'msg': '请先登录'}), 401
        return f(*args, **kwargs)
    return decorated

# ════════════════════════════════════════════════════════════
#  管理员登录 / 登出
# ════════════════════════════════════════════════════════════
@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    # 1. 显式处理跨域预检请求
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.json
        if not data:
            return jsonify({'code': 400, 'msg': '请求体不能为空'}), 400
            
        username = data.get('username', '')
        password = data.get('password', '')

        db = get_db()
        # 注意：这里改用普通的游标，或者确保传参是严格的元组
        cur = db.cursor(dictionary=True)
        
        # 修复核心：将参数写在 (username, password) 的圆括号内，确保它是严格的 Python 元组类型
        query = "SELECT id, username FROM admin WHERE username = %s AND password = %s"
        cur.execute(query, (str(username), str(password)))
        
        admin = cur.fetchone()
        cur.close()
        db.close()

        if admin:
            session['admin_id'] = admin['id']
            session['username'] = admin['username']
            return jsonify({'code': 200, 'msg': '登录成功'})
        
        return jsonify({'code': 400, 'msg': '用户名或密码错误'})
        
    except Exception as e:
        # 打印出具体的错误信息到 Flask 终端，方便调试
        print(f"【后端登录崩溃原因】: {str(e)}")
        return jsonify({'code': 500, 'msg': f'服务器内部错误: {str(e)}'}), 500


@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'code': 200, 'msg': '已登出'})


# ════════════════════════════════════════════════════════════
#  车辆管理
# ════════════════════════════════════════════════════════════
@app.route('/api/vehicles', methods=['GET'])
@login_required
def list_vehicles():
    db = get_db()
    cur = db.cursor(dictionary=True)
    cur.execute('SELECT * FROM vehicle ORDER BY id DESC')
    rows = cur.fetchall()
    db.close()
    return jsonify({'code': 200, 'data': rows})


@app.route('/api/vehicles', methods=['POST'])
@login_required
def add_vehicle():
    data = request.json
    plate = data.get('plate_number', '').strip().upper()
    owner = data.get('owner_name', '').strip()

    if not plate:
        return jsonify({'code': 400, 'msg': '车牌号不能为空'}), 400

    db = get_db()
    cur = db.cursor()
    try:
        cur.execute(
            'INSERT INTO vehicle (plate_number, owner_name) VALUES (%s, %s)',
            (plate, owner)
        )
        db.commit()
        return jsonify({'code': 200, 'msg': '车辆添加成功', 'id': cur.lastrowid})
    except mysql.connector.IntegrityError:
        return jsonify({'code': 400, 'msg': '该车牌已存在'}), 400
    finally:
        db.close()


# ════════════════════════════════════════════════════════════
#  车位管理
# ════════════════════════════════════════════════════════════
@app.route('/api/spaces', methods=['GET'])
@login_required
def list_spaces():
    db = get_db()
    cur = db.cursor(dictionary=True)
    cur.execute('SELECT * FROM parking_space ORDER BY space_no')
    rows = cur.fetchall()
    db.close()
    return jsonify({'code': 200, 'data': rows})


@app.route('/api/spaces/available', methods=['GET'])
@login_required
def available_spaces():
    db = get_db()
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT * FROM parking_space WHERE status='available' ORDER BY space_no")
    rows = cur.fetchall()
    db.close()
    return jsonify({'code': 200, 'data': rows, 'count': len(rows)})


# ════════════════════════════════════════════════════════════
#  入场登记
# ════════════════════════════════════════════════════════════
@app.route('/api/entry', methods=['POST'])
@login_required
def vehicle_entry():
    """
    body: { plate_number: "粤A12345", space_id: 3 }
    逻辑：查车辆 → 查车位空闲 → 写记录 → 更新车位状态
    """
    data = request.json
    plate = data.get('plate_number', '').strip().upper()
    space_id = data.get('space_id')

    if not plate or not space_id:
        return jsonify({'code': 400, 'msg': '缺少车牌号或车位'}), 400

    db = get_db()
    cur = db.cursor(dictionary=True)

    # 查车辆
    cur.execute('SELECT id FROM vehicle WHERE plate_number=%s', (plate,))
    vehicle = cur.fetchone()
    if not vehicle:
        db.close()
        return jsonify({'code': 404, 'msg': '车辆未登记，请先添加车辆'}), 404

    # 查车位是否空闲
    cur.execute("SELECT id, status FROM parking_space WHERE id=%s", (space_id,))
    space = cur.fetchone()
    if not space or space['status'] != 'available':
        db.close()
        return jsonify({'code': 400, 'msg': '该车位不可用'}), 400

    # 检查该车辆是否已在场内
    cur.execute(
        "SELECT id FROM parking_record WHERE vehicle_id=%s AND status='parked'",
        (vehicle['id'],)
    )
    if cur.fetchone():
        db.close()
        return jsonify({'code': 400, 'msg': '该车辆已在场内'}), 400

    # 写入停车记录
    entry_time = datetime.now()
    cur2 = db.cursor()
    cur2.execute(
        "INSERT INTO parking_record (vehicle_id, space_id, entry_time, status) VALUES (%s,%s,%s,'parked')",
        (vehicle['id'], space_id, entry_time)
    )
    # 更新车位状态
    cur2.execute("UPDATE parking_space SET status='occupied' WHERE id=%s", (space_id,))
    db.commit()
    db.close()

    return jsonify({
        'code': 200,
        'msg': '入场登记成功',
        'entry_time': entry_time.strftime('%Y-%m-%d %H:%M:%S')
    })


# ════════════════════════════════════════════════════════════
#  出场结算（自动计费）
# ════════════════════════════════════════════════════════════
RATE_PER_HOUR = 5.0   # 元/小时，不足1小时按1小时算

@app.route('/api/exit', methods=['POST'])
@login_required
def vehicle_exit():
    """
    body: { plate_number: "粤A12345" }
    逻辑：找在场记录 → 计算时长 → 计算费用 → 更新记录 → 释放车位
    """
    plate = request.json.get('plate_number', '').strip().upper()
    if not plate:
        return jsonify({'code': 400, 'msg': '缺少车牌号'}), 400

    db = get_db()
    cur = db.cursor(dictionary=True)

    cur.execute('''
        SELECT pr.id, pr.entry_time, pr.space_id, v.plate_number
        FROM parking_record pr
        JOIN vehicle v ON pr.vehicle_id = v.id
        WHERE v.plate_number = %s AND pr.status = 'parked'
    ''', (plate,))
    record = cur.fetchone()

    if not record:
        db.close()
        return jsonify({'code': 404, 'msg': '未找到该车辆的在场记录'}), 404

    exit_time = datetime.now()
    entry_time = record['entry_time']

    # 计算停车时长（向上取整到小时）
    duration_seconds = (exit_time - entry_time).total_seconds()
    duration_hours = max(1, -(-int(duration_seconds) // 3600))  # ceiling division
    fee = round(duration_hours * RATE_PER_HOUR, 2)

    cur2 = db.cursor()
    cur2.execute(
        "UPDATE parking_record SET exit_time=%s, fee=%s, status='completed' WHERE id=%s",
        (exit_time, fee, record['id'])
    )
    cur2.execute(
        "UPDATE parking_space SET status='available' WHERE id=%s",
        (record['space_id'],)
    )
    db.commit()
    db.close()

    return jsonify({
        'code': 200,
        'msg': '出场结算成功',
        'data': {
            'plate_number': plate,
            'entry_time': entry_time.strftime('%Y-%m-%d %H:%M:%S'),
            'exit_time': exit_time.strftime('%Y-%m-%d %H:%M:%S'),
            'duration_hours': duration_hours,
            'fee': fee
        }
    })


# ════════════════════════════════════════════════════════════
#  历史记录查询
# ════════════════════════════════════════════════════════════
@app.route('/api/records', methods=['GET'])
@login_required
def list_records():
    plate = request.args.get('plate', '')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    offset = (page - 1) * per_page

    db = get_db()
    cur = db.cursor(dictionary=True)

    where = ''
    params = []
    if plate:
        where = 'WHERE v.plate_number LIKE %s'
        params.append(f'%{plate.upper()}%')

    cur.execute(f'''
        SELECT pr.id, v.plate_number, v.owner_name,
               ps.space_no, pr.entry_time, pr.exit_time,
               pr.fee, pr.status
        FROM parking_record pr
        JOIN vehicle v ON pr.vehicle_id = v.id
        JOIN parking_space ps ON pr.space_id = ps.id
        {where}
        ORDER BY pr.entry_time DESC
        LIMIT %s OFFSET %s
    ''', params + [per_page, offset])
    rows = cur.fetchall()

    # 格式化时间
    for r in rows:
        if r['entry_time']:
            r['entry_time'] = r['entry_time'].strftime('%Y-%m-%d %H:%M:%S')
        if r['exit_time']:
            r['exit_time'] = r['exit_time'].strftime('%Y-%m-%d %H:%M:%S')

    db.close()
    return jsonify({'code': 200, 'data': rows, 'page': page})


# ════════════════════════════════════════════════════════════
#  统计概览（首页仪表盘用）
# ════════════════════════════════════════════════════════════
@app.route('/api/stats', methods=['GET'])
@login_required
def stats():
    db = get_db()
    cur = db.cursor(dictionary=True)

    cur.execute("SELECT COUNT(*) AS total FROM parking_space")
    total = cur.fetchone()['total']

    cur.execute("SELECT COUNT(*) AS occupied FROM parking_space WHERE status='occupied'")
    occupied = cur.fetchone()['occupied']

    cur.execute("SELECT COALESCE(SUM(fee),0) AS today_income FROM parking_record WHERE DATE(exit_time)=CURDATE()")
    today_income = cur.fetchone()['today_income']

    cur.execute("SELECT COUNT(*) AS parked FROM parking_record WHERE status='parked'")
    parked = cur.fetchone()['parked']

    db.close()
    return jsonify({
        'code': 200,
        'data': {
            'total_spaces': total,
            'occupied_spaces': occupied,
            'available_spaces': total - occupied,
            'parked_vehicles': parked,
            'today_income': float(today_income)
        }
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
