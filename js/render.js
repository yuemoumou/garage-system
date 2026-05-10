function renderTable(data = carList){

    const tableBody = document.getElementById("carTableBody");

    if(!tableBody) return;

    tableBody.innerHTML = "";

    data.forEach((car) => {

        tableBody.innerHTML += `
        <tr>
            <td>${car.carNumber}</td>
            
            <td>
                ${formatTime(car.enterTime)}
            </td>

            <td>${car.status}</td>

            <td>${car.fee}元</td>

            <td>
                ${
                    car.status === "停车中"

                    ?

                    `
                    <button onclick="checkoutCar(${car.id})">
                        出场收费
                    </button>
                    `
                    :
                    `
                    已完成
                    `
                }
            </td>
        </tr>
        `;
    });
}