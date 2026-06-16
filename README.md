# plugin_proxy
plugin for self-hosted proxy

## Плагин для личного прокси сервера. Удобно использовать в отдельном браузере, чтобы отделить трафик


## 🛠️ Последовательность
- **Склонировать репозиторий**
```bash
git clone https://github.com/adjuster2004/plugin_proxy/
```

- **На личном сервере создать папку**

```
mkdir ~/chrome-proxy && cd ~/chrome-proxy
```

- **Скопировать в эту папку файлы из папки server**

```
nano docker-compose.yml
```

```
nano config.json
```

- **Заменить логины и пароли в файле config.json на свои. Можно создать сколько угодно пользователей**

- **Запустить контейнер**

```
docker compose up -d
```
Или

```
docker-compose up -d
```

- **Добавить плагин в браузере**

Требуется включить режим разработчика

```
chrome://extensions/
```

- **Указать настройки сервера и сохранить. Нажать подключение и проверить IP адрес**

<img width="535" height="800" alt="image" src="https://github.com/user-attachments/assets/9b630ab2-1c65-4d6f-8629-e3719ca25aea" />

## ВАЖНО!!! Хотя, нет.
