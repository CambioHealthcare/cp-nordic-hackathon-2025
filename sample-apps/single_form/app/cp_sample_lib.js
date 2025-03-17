const ehrId = getQueryParam('ehr_id');

if (ehrId)  {
    document.querySelector('.container').style.display = 'block';
    document.getElementById('ehr_id-input').value = ehrId;
} else {
    displayErrorMessage('Error: Missing EHR ID. Please provide a valid \'ehr_id\'.');
}

const jwtToken = getQueryParam('jwtToken');

function updateEhrId() {
    const newEhrId = document.getElementById('ehr_id-input').value;
    if (newEhrId) {
        const url = new URL(window.location.href);
        url.searchParams.set('ehr_id', newEhrId);
        window.location.href = url.toString();
    }
}

function addForm(documentId, formId, formVersion) {
    const documentSelected = document.querySelector("#" + documentId);
    documentSelected.src = getFormUrl(formId, formVersion);
}

function addGrafanaChart(documentId, chartId) {
    const documentSelected = document.querySelector("#" + documentId);
    documentSelected.src = getDashboardUrl(chartId, ehrId); 
}

window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.type === 'output') { 
        Promise.all(message.data.map(persistToCDR))
            .catch(() => displayErrorMessage(error.message));
    }
});

function persistToCDR(instruction) {
    instruction.data.uid = null;
    headers = {
        'Content-Type': 'application/json'
    }
    if (jwtToken) {
        headers['Authorization'] = 'Bearer ' + jwtToken;
    }

    return fetch(cdrBaseUrl + '/api/v1/ehr/' + ehrId + '/composition', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(instruction.data)
    }).then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
        .then(data => {
            console.log('Success:', data);
        })
        .catch(error => {
            console.error('Error:', error);
            displayErrorMessage(error.message)
        });
}

function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function displayErrorMessage(message) {
    const errorMessageDiv = document.getElementById('error-message');
    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = 'block';
    setTimeout(() => {
         errorMessageDiv.style.display = 'none';
    }, 10000);
}

function getDashboardUrl(dashboardId, ehrId, panelId = 1) {
    return grafanaBaseUrl + "/d-solo/" + dashboardId + "?orgId=1&panelId=" + panelId + "&theme=light&query-param-ehr_id=" + ehrId + jwtTokenParam();
}

function jwtTokenParam() {
    return jwtToken ? "&jwtToken=" + jwtToken : "";
}

function getFormUrl(formId, formVersion) {
    return formsBaseUrl + "/" + formId + "/" + formVersion;
}