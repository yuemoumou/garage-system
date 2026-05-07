const loginBtn = document.getElementById("loginBtn");

loginBtn.onclick = function () {

    const username = document.getElementById("username").value;

    const password = document.getElementById("password").value;

    const msg = document.getElementById("msg");

    if(username === "admin" && password === "123456"){

        msg.style.color = "green";

        msg.innerText = "登录成功";

    }else{

        msg.style.color = "red";

        msg.innerText = "用户名或密码错误";

    }

}