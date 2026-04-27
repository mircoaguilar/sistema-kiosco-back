(function () {
    const hostname = window.location.hostname;

    let API_URL;

    if (
        hostname.includes("staging") ||
        hostname.includes("tasting") ||
        hostname.includes("localhost")
    ) {
        API_URL = "https://kiosco-staging.onrender.com/api";
    } 
    else {
        API_URL = "https://sistema-kiosco.onrender.com/api";
    }

    window.APP_CONFIG = {
        API_URL
    };
})();