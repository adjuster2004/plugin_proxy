document.addEventListener('DOMContentLoaded', async () => {
    const serverSelect = document.getElementById('serverSelect');
    const toggleBtn = document.getElementById('toggleBtn');
    const deleteServerBtn = document.getElementById('deleteServerBtn');
    const editServerBtn = document.getElementById('editServerBtn'); // Новая кнопка
    
    // Поля формы
    const newName = document.getElementById('newName');
    const newHost = document.getElementById('newHost');
    const newPort = document.getElementById('newPort');
    const newUsername = document.getElementById('newUsername');
    const newPassword = document.getElementById('newPassword');
    const addServerBtn = document.getElementById('addServerBtn');

    let { servers = [], activeServerId = null, isActive = false } = await chrome.storage.local.get(['servers', 'activeServerId', 'isActive']);
    
    // Флаг режима редактирования
    let editingServerId = null;

    function renderServerList() {
        serverSelect.innerHTML = '';
        if (servers.length === 0) {
            const opt = document.createElement('option');
            opt.textContent = '-- Нет сохраненных серверов --';
            serverSelect.appendChild(opt);
            
            toggleBtn.disabled = true;
            deleteServerBtn.disabled = true;
            editServerBtn.disabled = true;
            return;
        }
        
        toggleBtn.disabled = false;
        deleteServerBtn.disabled = false;
        editServerBtn.disabled = false;

        servers.forEach(server => {
            const opt = document.createElement('option');
            opt.value = server.id;
            opt.textContent = server.name || server.host;
            if (server.id === activeServerId) opt.selected = true;
            serverSelect.appendChild(opt);
        });
    }

    function updateButtonState(active) {
        if (active) {
            toggleBtn.textContent = 'ВЫКЛЮЧИТЬ ПРОКСИ';
            toggleBtn.className = 'on';
        } else {
            toggleBtn.textContent = 'ВКЛЮЧИТЬ ПРОКСИ';
            toggleBtn.className = 'off';
        }
    }

    // Сброс формы и выход из режима редактирования
    function resetForm() {
        editingServerId = null;
        newName.value = ''; newHost.value = ''; newPort.value = ''; newUsername.value = ''; newPassword.value = '';
        addServerBtn.textContent = 'Сохранить сервер';
        addServerBtn.className = 'secondary';
    }

    renderServerList();
    updateButtonState(isActive);

    // --- КНОПКА РЕДАКТИРОВАТЬ ---
    editServerBtn.addEventListener('click', () => {
        if (!activeServerId) return;
        const currentServer = servers.find(s => s.id === activeServerId);
        if (!currentServer) return;

        // Заполняем форму данными сервера
        editingServerId = currentServer.id;
        newName.value = currentServer.name || '';
        newHost.value = currentServer.host || '';
        newPort.value = currentServer.port || '';
        newUsername.value = currentServer.username || '';
        newPassword.value = currentServer.password || '';

        // Меняем внешний вид кнопки сохранения
        addServerBtn.textContent = 'Сохранить изменения';
        addServerBtn.className = 'on'; // Делаем зелененькой для привлечения внимания
    });

    // --- ДОБАВЛЕНИЕ / ОБНОВЛЕНИЕ СЕРВЕРА ---
    addServerBtn.addEventListener('click', async () => {
        if (!newHost.value || !newPort.value) {
            alert('Заполните хотя бы IP и Порт!');
            return;
        }

        if (editingServerId) {
            // РЕЖИМ ОБНОВЛЕНИЯ
            const index = servers.findIndex(s => s.id === editingServerId);
            if (index !== -1) {
                servers[index] = {
                    ...servers[index], // Сохраняем старый ID
                    name: newName.value.trim() || newHost.value,
                    host: newHost.value.trim(),
                    port: parseInt(newPort.value),
                    username: newUsername.value.trim(),
                    password: newPassword.value
                };

                // Если мы обновили активный сервер и прокси сейчас включен - перезапускаем соединение
                if (activeServerId === editingServerId && toggleBtn.classList.contains('on')) {
                    chrome.runtime.sendMessage({ action: 'START_PROXY', config: servers[index] });
                }
            }
        } else {
            // РЕЖИМ ДОБАВЛЕНИЯ НОВОГО
            const newServer = {
                id: Date.now().toString(),
                name: newName.value.trim() || newHost.value,
                host: newHost.value.trim(),
                port: parseInt(newPort.value),
                username: newUsername.value.trim(),
                password: newPassword.value
            };
            servers.push(newServer);
            if (!activeServerId) activeServerId = newServer.id;
        }

        await chrome.storage.local.set({ servers, activeServerId });
        resetForm();
        renderServerList();
    });

    // --- СМЕНА СЕРВЕРА ---
    serverSelect.addEventListener('change', async () => {
        activeServerId = serverSelect.value;
        await chrome.storage.local.set({ activeServerId });
        resetForm(); // Если переключили сервер, сбрасываем режим редактирования

        if (toggleBtn.classList.contains('on')) {
            const currentServer = servers.find(s => s.id === activeServerId);
            chrome.runtime.sendMessage({ action: 'START_PROXY', config: currentServer });
        }
    });

    // --- УДАЛЕНИЕ СЕРВЕРА ---
    deleteServerBtn.addEventListener('click', async () => {
        if (!activeServerId) return;

        servers = servers.filter(s => s.id !== activeServerId);
        
        if (toggleBtn.classList.contains('on')) {
            chrome.runtime.sendMessage({ action: 'STOP_PROXY' });
            isActive = false;
            updateButtonState(false);
        }

        activeServerId = servers.length > 0 ? servers[0].id : null;
        await chrome.storage.local.set({ servers, activeServerId, isActive });
        
        resetForm();
        renderServerList();
    });

    // --- ВКЛ / ВЫКЛ ---
    toggleBtn.addEventListener('click', async () => {
        const currentlyOn = toggleBtn.classList.contains('on');
        const newState = !currentlyOn;

        if (newState) {
            const currentServer = servers.find(s => s.id === activeServerId);
            if (currentServer) {
                chrome.runtime.sendMessage({ action: 'START_PROXY', config: currentServer });
            }
        } else {
            chrome.runtime.sendMessage({ action: 'STOP_PROXY' });
        }

        updateButtonState(newState);
        await chrome.storage.local.set({ isActive: newState });
    });
});