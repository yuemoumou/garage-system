const tableBody = document.getElementById("carTableBody");

function renderTable(data = carList){

    tableBody.innerHTML = "";

    data.forEach((car) => {

        tableBody.innerHTML += `
        <tr>
            <td>${car.carNumber}</td>
            <td>${car.time}</td>
            <td>
                <button class="delete-btn" onclick="deleteCar(${car.id})">
                    删除
                </button>
            </td>
        </tr>
        `;
    });
}