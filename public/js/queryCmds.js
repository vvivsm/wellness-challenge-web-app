function fetchMethod(url, callback, method = "GET", data = null, token = null) {
    const headers = {
        "Content-Type": "application/json"
    };

    if (data) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers["Authorization"] = "Bearer " + token;
    }

    let options = {
        method: method.toUpperCase(),
        headers: headers,
    };

    if (method.toUpperCase() !== "GET" && data !== null) {
        options.body = JSON.stringify(data);
    }

    fetch(url, options)
        .then((response) => {
            if (response.status == 204) {
                callback(response.status, {});
            } else {
                response.json().then((responseData) => callback(response.status, responseData));
            }
        })
        .catch((error) => console.error(`Error from ${method} ${url}:`, error));
}

function jqueryMethod(url, callback, method = "GET", data = null, token = null) {
    const headers = {};

    if (data) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers["Authorization"] = "Bearer " + token;
    }

    const jqueryConfig = {
        url: url,
        type: method.toUpperCase(),
        headers: headers,
        data: data,
        dataType: "json",
        success: function (responseData, textStatus, jqXHR) {
            callback(jqXHR.status, responseData);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error(`Error from ${method} ${url}:`, errorThrown);
        },
    };

    $.ajax(jqueryConfig);
}

function axiosMethod(url, callback, method = "GET", data = null, token = null) {
    const headers = {};

    if (data) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers["Authorization"] = "Bearer " + token;
    }

    const axiosConfig = {
        method: method.toUpperCase(),
        url: url,
        headers: headers,
        data: data,
    };

    axios(axiosConfig)
        .then((response) => callback(response.status, response.data))
        .catch((error) => console.error(`Error from ${method} ${url}:`, error));
}
