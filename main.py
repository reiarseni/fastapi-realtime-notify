from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Depends, Response
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from typing import Dict, List, Optional
import asyncio
import time
import random
import json
import uuid

# Añade esto al principio del archivo si no está
import logging

# Configura el logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Montamos las carpetas estáticas y templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Almacén para las notificaciones (simulando una base de datos)
notifications_store: Dict[str, List[Dict]] = {
    "1": [],
    "2": []
}

# Conexiones WebSocket activas
active_connections: Dict[str, WebSocket] = {}

# Función para generar notificaciones aleatorias
def generate_notification(user_id: str) -> Dict:
    notification_types = ["mensaje", "alerta", "actualización", "recordatorio"]
    notification_type = random.choice(notification_types)
    
    messages = {
        "mensaje": [
            "Tienes un nuevo mensaje de Carolina",
            "Miguel te ha enviado un mensaje importante",
            "Nuevo mensaje del equipo de soporte"
        ],
        "alerta": [
            "Alerta de seguridad: Inicio de sesión desde una nueva ubicación",
            "Tu suscripción está a punto de expirar",
            "Se detectó actividad inusual en tu cuenta"
        ],
        "actualización": [
            "Nueva actualización disponible para tu aplicación",
            "Tu pedido ha sido actualizado",
            "Se ha completado una tarea programada"
        ],
        "recordatorio": [
            "Recordatorio: Reunión de equipo en 30 minutos",
            "No olvides completar tu perfil",
            "Tienes tareas pendientes por realizar"
        ]
    }
    
    return {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": notification_type,
        "message": random.choice(messages[notification_type]),
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "read": False
    }

# Tarea en segundo plano para generar notificaciones
@app.on_event("startup")
async def start_notification_generator():
    asyncio.create_task(notification_generator())

async def notification_generator():
    while True:
        for user_id in notifications_store.keys():
            notification = generate_notification(user_id)
            notifications_store[user_id].append(notification)
            
            # Notificar al usuario si está conectado
            if user_id in active_connections:
                try:
                    await active_connections[user_id].send_text(json.dumps({
                        "action": "new_notification",
                        "count": len(notifications_store[user_id])
                    }))
                except Exception:
                    # Si hay un error al enviar, eliminamos la conexión
                    active_connections.pop(user_id, None)
                    
        await asyncio.sleep(10)  # Generar cada 10 segundos

@app.get("/")
async def get_index(request: Request, user_id: str = "1"):
    if user_id not in notifications_store:
        user_id = "1"  # Usuario por defecto si se proporciona uno inválido
    return templates.TemplateResponse("index.html", {"request": request, "user_id": user_id})

@app.get("/api/notifications/{user_id}")
async def get_notifications(user_id: str):
    if user_id not in notifications_store:
        return JSONResponse(status_code=404, content={"message": "Usuario no encontrado"})
    
    # Obtener todas las notificaciones no leídas
    notifications = notifications_store[user_id]
    
    # Vaciar la cola de notificaciones
    notifications_store[user_id] = []
    
    return JSONResponse(content={"notifications": notifications})

# En el endpoint del websocket, añade más logs
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    logger.info(f"Intento de conexión WebSocket para el usuario: {user_id}")
    
    try:
        await websocket.accept()
        logger.info(f"Conexión WebSocket aceptada para el usuario: {user_id}")
        
        if user_id not in notifications_store:
            logger.warning(f"Usuario inválido intentó conectarse: {user_id}")
            await websocket.close(code=1008, reason="Usuario inválido")
            return
        
        # Registrar la conexión WebSocket
        active_connections[user_id] = websocket
        logger.info(f"Usuario {user_id} registrado en conexiones activas")
        
        # Si hay notificaciones pendientes, enviar un mensaje de inmediato
        if len(notifications_store[user_id]) > 0:
            logger.info(f"Enviando {len(notifications_store[user_id])} notificaciones pendientes al usuario {user_id}")
            await websocket.send_text(json.dumps({
                "action": "new_notification",
                "count": len(notifications_store[user_id])
            }))
        
        # Mantener la conexión abierta y escuchar mensajes
        while True:
            data = await websocket.receive_text()
            logger.info(f"Mensaje recibido del usuario {user_id}: {data}")
            # Podríamos procesar mensajes del cliente aquí si fuera necesario
    except WebSocketDisconnect:
        logger.info(f"Usuario {user_id} desconectado")
        # Eliminar la conexión cuando se desconecte
        active_connections.pop(user_id, None)
    except Exception as e:
        logger.error(f"Error en WebSocket para usuario {user_id}: {str(e)}")
        # Eliminar la conexión en caso de error
        active_connections.pop(user_id, None)
