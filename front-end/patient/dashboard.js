document.addEventListener("DOMContentLoaded", () => {

    loadAppointments();

});

function loadAppointments() {

    const appointments = NexCareStore.listAppointments();
    const table = document.querySelector("#appointmentsTable tbody");

    if (!table) return;

    table.innerHTML = "";

    appointments.forEach(appt => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${appt.department}</td>
            <td>${appt.doctor}</td>
            <td>${appt.dateLabel}</td>
            <td>${appt.timeLabel}</td>
            <td>${appt.status}</td>
        `;

        table.appendChild(row);

    });

}