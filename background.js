let proxyCredentials = null;

// При запуске инициализируем активный сервер из списка
chrome.storage.local.get(['servers', 'activeServerId', 'isActive'], (data) => {
    if (data.isActive && data.servers && data.activeServerId) {
        const activeServer = data.servers.find(s => s.id === data.activeServerId);
        if (activeServer) {
            proxyCredentials = activeServer;
            setProxy(activeServer);
        }
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'START_PROXY') {
        proxyCredentials = message.config; 
        setProxy(message.config);
    } else if (message.action === 'STOP_PROXY') {
        proxyCredentials = null;
        clearProxy();
    }
});

function setProxy(config) {
    const proxySettings = {
        mode: "fixed_servers",
        rules: {
            singleProxy: {
                scheme: "http", 
                host: config.host,
                port: config.port
            },
            bypassList: ["localhost", "127.0.0.1"]
        }
    };
    chrome.proxy.settings.set({ value: proxySettings, scope: "regular" });
}

function clearProxy() {
    chrome.proxy.settings.clear({ scope: "regular" });
}

// Синхронная авторизация
chrome.webRequest.onAuthRequired.addListener(
    (details) => {
        if (!details.isProxy) return {};

        if (proxyCredentials && proxyCredentials.username) {
            return {
                authCredentials: {
                    username: proxyCredentials.username,
                    password: proxyCredentials.password
                }
            };
        }
        return { cancel: true };
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
);