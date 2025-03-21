# FastApi RealTime Notify

Sistema de notificaciones en tiempo real utilizando FastAPI, WebSockets y AJAX, con una interfaz elegante en Bootstrap.

## Descripción

RealTime Notify es un sistema de notificaciones en tiempo real que demuestra la implementación de comunicación bidireccional mediante WebSockets para señalización y AJAX para la transferencia de datos. Permite a los usuarios recibir alertas instantáneas con retroalimentación visual y auditiva.

## Características

- ⚡ Notificaciones en tiempo real mediante WebSockets
- 🔄 Reconexión automática con backoff exponencial
- 🔔 Alertas visuales y sonoras
- 👥 Sistema multi-usuario con colas de notificaciones separadas
- 🎨 Interfaz moderna con Bootstrap 5
- 📱 Diseño responsive

## Tecnologías

- **Backend**: FastAPI, WebSockets, Uvicorn
- **Frontend**: JavaScript moderno (vanilla), Bootstrap 5
- **Plantillas**: Jinja2
- **Comunicación**: WebSockets para señalización, AJAX para transferencia de datos

## Requisitos

- Python 3.7+
- FastAPI
- Uvicorn
- Jinja2

## Instalación

1. Crea un entorno virtual:
```bash
python -m venv venv
```

2. Activa el entorno virtual:
   - En Windows:
   ```bash
   venv\Scripts\activate
   ```
   - En macOS/Linux:
   ```bash
   source venv/bin/activate
   ```

3. Instala las dependencias:
```bash
pip install fastapi uvicorn jinja2 python-multipart websockets
```

4. Clona el repositorio:
```bash
git clone https://github.com/yourusername/realtime-notify.git
cd realtime-notify
```

## Estructura del Proyecto

```
/
├── main.py             # Backend principal con FastAPI
├── /templates/
│   └── index.html      # Plantilla HTML principal
└── /static/
    ├── main.js         # JavaScript para manejo de WebSockets
    └── notification.mp3 # Sonido de notificación
```

## Uso

1. Inicia el servidor:
```bash
uvicorn main:app --reload
#for debug purposes:
uvicorn main:app --reload --log-level debug
```

2. Accede a la aplicación:
   - Usuario 1: [http://localhost:8000/?user_id=1](http://localhost:8000/?user_id=1)
   - Usuario 2: [http://localhost:8000/?user_id=2](http://localhost:8000/?user_id=2)

3. Abre ambas URLs en navegadores o pestañas diferentes para ver la interacción en tiempo real.

## Funcionamiento

- El sistema genera automáticamente una notificación cada 10 segundos para cada usuario
- Las notificaciones se muestran en tiempo real mediante WebSockets
- Los usuarios pueden ver sus notificaciones específicas
- Al hacer clic en el botón de notificaciones, se obtienen los datos completos mediante AJAX
- Se reproduce un sonido de alerta cuando llegan nuevas notificaciones

## Personalización

### Añadir sonidos personalizados

1. Coloca tu archivos de audio en la carpeta `static`
2. Actualiza las referencias en `index.html`:

```html
<audio id="notificationSound" preload="auto">
    <source src="/static/tu-sonido.mp3" type="audio/mp3">
</audio>
```

### Añadir nuevos tipos de notificaciones

Modifica la función `generate_notification` en `main.py` para incluir nuevos tipos.

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue antes de enviar un pull request para discutir los cambios importantes.

## Licencia

MIT
