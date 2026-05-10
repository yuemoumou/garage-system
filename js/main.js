/* 内容区域 */
const content = document.getElementById("content");

/* Toast 定时器 */
let toastTimer = null;

/* Dashboard 首页 */
function showDashboard(){

    /* 停车中 */
    const parkingCount = carList.filter(car => {

        return car.status === "停车中";

    }).length;

    /* 已离场 */
    const finishCount = carList.filter(car => {

        return car.status === "已离场";

    }).length;

    /* 总收入 */
    let totalMoney = 0;

    carList.forEach(car => {

        totalMoney += car.fee;
    });

    content.innerHTML = `

        <div class="dashboard">

            <div class="card">
                <h3>车辆总数</h3>
                <p>${carList.length}</p>
            </div>

            <div class="card">
                <h3>停车中</h3>
                <p>${parkingCount}</p>
            </div>

            <div class="card">
                <h3>已离场</h3>
                <p>${finishCount}</p>
            </div>

            <div class="card">
                <h3>总收入</h3>
                <p>${totalMoney} 元</p>
            </div>

        </div>

        <h1>欢迎使用车库管理系统</h1>

        <p>请选择左侧菜单功能</p>

        <div id="chart" style="height:400px;"></div>
    `;

    /* 图表 */
    const chart = echarts.init(
        document.getElementById("chart")
    );

    chart.setOption({

        title:{
            text:"车辆状态统计"
        },

        tooltip:{},

        series:[
            {
                type:"pie",

                radius:"65%",

                data:[
                    {
                        name:"停车中",
                        value:parkingCount
                    },

                    {
                        name:"已离场",
                        value:finishCount
                    }
                ]
            }
        ]
    });
}

/* 车辆管理页面 */
function showCarPage(){

    content.innerHTML = `

        <h1>车辆管理</h1>

        <button id="addBtn">
            添加车辆
        </button>

        <input
            type="text"
            id="searchInput"
            placeholder="请输入车牌号"
        >

        <button id="searchBtn">
            查询
        </button>

        <table>

            <thead>

                <tr>

                    <th>车牌号</th>

                    <th>入场时间</th>

                    <th>状态</th>

                    <th>费用</th>

                    <th>操作</th>

                </tr>

            </thead>

            <tbody id="carTableBody">

            </tbody>

        </table>
    `;

    renderTable();

    bindEvents();
}

/* 收费记录页面 */
function showChargePage(){

    const chargeList = carList.filter(car => {

        return car.status === "已离场";
    });

    let total = 0;

    chargeList.forEach(car => {

        total += car.fee;
    });

    content.innerHTML = `

        <h1>收费记录</h1>

        <h3>
            总收入：${total} 元
        </h3>

        <table>

            <thead>

                <tr>

                    <th>车牌号</th>

                    <th>入场时间</th>

                    <th>离场时间</th>

                    <th>收费金额</th>

                </tr>

            </thead>

            <tbody>

                ${
                    chargeList.length === 0

                    ?

                    `
                    <tr>

                        <td colspan="4">
                            暂无收费记录
                        </td>

                    </tr>
                    `

                    :

                    chargeList.map(car => {

                        return `

                            <tr>

                                <td>${car.carNumber}</td>

                                <td>
                                    ${formatTime(car.enterTime)}
                                </td>

                                <td>
                                    ${formatTime(car.exitTime)}
                                </td>

                                <td>
                                    ${car.fee} 元
                                </td>

                            </tr>

                        `;

                    }).join("")
                }

            </tbody>

        </table>
    `;
}

/* 绑定事件 */
function bindEvents(){

    const addBtn = document.getElementById("addBtn");

    const searchBtn = document.getElementById("searchBtn");

    /* 添加车辆 */
    addBtn.onclick = function(){

        modal.style.display = "flex";
    }

    /* 查询 */
    searchBtn.onclick = function(){

        const keyword = document
            .getElementById("searchInput")
            .value
            .toLowerCase();

        const result = carList.filter(car => {

            return car.carNumber
                .toLowerCase()
                .includes(keyword);
        });

        renderTable(result);
    }
}

/* 删除车辆 */
function deleteCar(id){

    const index = carList.findIndex(car => {

        return car.id === id;
    });

    if(index !== -1){

        carList.splice(index, 1);

        saveData();

        renderTable();

        showToast("删除成功");

        refreshDashboardIfNeeded();
    }
}

/* 时间格式化 */
function formatTime(time){

    const date = new Date(time);

    return date.toLocaleString();
}

/* 出场收费 */
function checkoutCar(id){

    const car = carList.find(car => {

        return car.id === id;
    });

    if(!car) return;

    /* 离场时间 */
    car.exitTime = Date.now();

    /* 停车时长 */
    const hours = Math.ceil(

        (car.exitTime - car.enterTime)

        /

        (1000 * 60 * 60)
    );

    /* 收费 */
    car.fee = hours * 5;

    car.status = "已离场";

    saveData();

    renderTable();

    showToast(

        `${car.carNumber} 收费成功，
        金额 ${car.fee} 元`
    );

    refreshDashboardIfNeeded();
}

/* Dashboard 自动刷新 */
function refreshDashboardIfNeeded(){

    if(
        document
        .getElementById("menu-dashboard")
        .classList.contains("active")
    ){

        showDashboard();
    }
}

/* 菜单高亮 */
function setActiveMenu(id){

    const menus = document.querySelectorAll(".menu-item");

    menus.forEach(menu => {

        menu.classList.remove("active");
    });

    document
        .getElementById(id)
        .classList.add("active");
}

/* Loading */
function showLoading(){

    const loading = document.getElementById("loading");

    loading.style.display = "flex";

    setTimeout(() => {

        loading.style.display = "none";

    }, 400);
}

/* 菜单：首页 */
document.getElementById("menu-dashboard").onclick = function(){

    showLoading();

    setActiveMenu("menu-dashboard");

    setTimeout(() => {

        showDashboard();

    }, 300);
}

/* 菜单：车辆管理 */
document.getElementById("menu-car").onclick = function(){

    showLoading();

    setActiveMenu("menu-car");

    setTimeout(() => {

        showCarPage();

    }, 300);
}

/* 菜单：收费记录 */
document.getElementById("menu-charge").onclick = function(){

    showLoading();

    setActiveMenu("menu-charge");

    setTimeout(() => {

        showChargePage();

    }, 300);
}

/* 弹窗 */
const modal = document.getElementById("modal");

const confirmBtn = document.getElementById("confirmBtn");

const cancelBtn = document.getElementById("cancelBtn");

/* 取消 */
cancelBtn.onclick = function(){

    modal.style.display = "none";

    document.getElementById("carNumberInput").value = "";
}

/* 确认 */
confirmBtn.onclick = function(){

    const carNumber = document
        .getElementById("carNumberInput")
        .value;

    if(carNumber){

        carList.push({

            id: Date.now(),

            carNumber,

            enterTime: Date.now(),

            exitTime: null,

            fee: 0,

            status: "停车中"
        });

        saveData();

        renderTable();

        modal.style.display = "none";

        document.getElementById("carNumberInput").value = "";

        showToast("车辆添加成功");

        refreshDashboardIfNeeded();
    }
}

/* Toast */
function showToast(message){

    const toast = document.getElementById("toast");

    toast.innerText = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 2000);
}

/* 深色模式 */
const themeBtn = document.getElementById("themeBtn");

themeBtn.onclick = function(){

    document.body.classList.toggle("dark");
}

/* 默认首页 */
showDashboard();

/* 默认菜单高亮 */
setActiveMenu("menu-dashboard");