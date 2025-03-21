// Variables globales
let socket = null;
let notificationCount = 0;
let reconnectAttempts = 0;
let maxReconnectAttempts = 5;
let reconnectTimeout = null;
let reconnectDelay = 2000; // Tiempo inicial de espera para reconexión (2 segundos)

// Elementos DOM
const notificationBadge = document.getElementById('notificationBadge');
const notificationBtn = document.getElementById('notificationBtn');
const notificationList = document.getElementById('notificationList');
const connectionStatus = document.getElementById('connectionStatus');

// En la función initWebSocket
function initWebSocket() {
    try {
        // Cerrar el socket existente si hay uno
        if (socket) {
            console.log('Cerrando socket existente');
            socket.close();
        }

        // Determinar la URL del WebSocket
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/${USER_ID}`;
        
        console.log('Conectando WebSocket a:', wsUrl);
        
        // Crear nueva conexión WebSocket
        socket = new WebSocket(wsUrl);
        
        // Evento de conexión establecida
        socket.onopen = function(event) {
            console.log('Conexión WebSocket establecida correctamente');
            updateConnectionStatus(true);
            
            // Resetear contador de intentos de reconexión
            reconnectAttempts = 0;
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
                reconnectTimeout = null;
            }
        };
        
        // Evento de mensaje recibido
        socket.onmessage = function(event) {
            console.log('Datos recibidos del servidor:', event.data);
            try {
                const data = JSON.parse(event.data);
                console.log('Mensaje procesado:', data);
                
                if (data.action === 'new_notification') {
                    // Actualizar contador de notificaciones
                    notificationCount = data.count;
                    updateNotificationBadge();
                }
            } catch (e) {
                console.error('Error al procesar el mensaje recibido:', e);
            }
        };
        
        // Evento de error
        socket.onerror = function(error) {
            console.error('Error en la conexión WebSocket:', error);
            console.log('Estado del socket:', socket.readyState);
            updateConnectionStatus(false);
        };
        
        // Evento de cierre de conexión
        socket.onclose = function(event) {
            console.log('Conexión WebSocket cerrada. Código:', event.code, 'Razón:', event.reason || 'No especificada');
            updateConnectionStatus(false);
            
            // Intentar reconectar si no se ha alcanzado el límite de intentos
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                const delay = reconnectDelay * Math.pow(1.5, reconnectAttempts - 1); // Backoff exponencial
                console.log(`Intentando reconectar en ${delay}ms (intento ${reconnectAttempts}/${maxReconnectAttempts})`);
                
                reconnectTimeout = setTimeout(() => {
                    initWebSocket();
                }, delay);
            } else {
                console.error('Se alcanzó el número máximo de intentos de reconexión');
            }
        };
    } catch (error) {
        console.error('Error crítico al inicializar WebSocket:', error);
    }
}

// Función para actualizar el estado de conexión en la UI
function updateConnectionStatus(connected) {
    if (connected) {
        connectionStatus.className = 'connection-status connected';
        connectionStatus.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i> Conectado';
    } else {
        connectionStatus.className = 'connection-status disconnected';
        connectionStatus.innerHTML = '<i class="bi bi-x-circle-fill me-1"></i> Desconectado';
    }
}

// Función para actualizar el contador de notificaciones
function updateNotificationBadge() {
    if (notificationCount > 0) {
        notificationBadge.textContent = notificationCount;
        notificationBadge.classList.remove('d-none');
    } else {
        notificationBadge.classList.add('d-none');
    }
}

// Función para obtener las notificaciones mediante AJAX
function fetchNotifications() {
    // Solo hacemos la petición si hay notificaciones pendientes
    if (notificationCount > 0) {
        fetch(`/api/notifications/${USER_ID}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                displayNotifications(data.notifications);
                // Resetear contador después de obtener las notificaciones
                notificationCount = 0;
                updateNotificationBadge();
            })
            .catch(error => {
                console.error('Error al obtener notificaciones:', error);
            });
    }
}

// Función para mostrar las notificaciones en la UI
function displayNotifications(notifications) {
    // Si no hay notificaciones para mostrar, mantener mensaje vacío
    if (!notifications || notifications.length === 0) {
        return;
    }
    
    // Limpiar mensaje de vacío si es el primer conjunto de notificaciones
    if (notificationList.querySelector('.text-center')) {
        notificationList.innerHTML = '';
    }
    
    // Crear elementos para cada notificación
    notifications.forEach(notification => {
        const notificationElement = document.createElement('div');
        notificationElement.className = `card notification-item ${notification.type} mb-3`;
        notificationElement.id = `notification-${notification.id}`;
        
        // Determinar icono según el tipo de notificación
        let icon = 'bi-envelope-fill';
        if (notification.type === 'alerta') icon = 'bi-exclamation-triangle-fill';
        if (notification.type === 'actualización') icon = 'bi-arrow-clockwise';
        if (notification.type === 'recordatorio') icon = 'bi-calendar-check-fill';
        
        notificationElement.innerHTML = `
            <div class="card-body">
                <div class="d-flex align-items-center">
                    <div class="flex-shrink-0">
                        <i class="bi ${icon} fs-4"></i>
                    </div>
                    <div class="flex-grow-1 ms-3">
                        <h6 class="mb-1">${notification.message}</h6>
                        <div class="d-flex justify-content-between">
                            <small class="text-muted">${notification.created_at}</small>
                            <span class="badge bg-secondary">${notification.type}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Añadir la notificación al principio de la lista
        notificationList.insertBefore(notificationElement, notificationList.firstChild);
        
        // Aplicar efecto de resaltado
        setTimeout(() => {
            notificationElement.style.backgroundColor = '#f8f9fa';
        }, 50);
        setTimeout(() => {
            notificationElement.style.backgroundColor = '';
        }, 1000);
    });
}

// Evento de clic en el botón de notificaciones
notificationBtn.addEventListener('click', function() {
    fetchNotifications();
});

// Inicializar WebSocket al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    initWebSocket();
    
    // Verificar reconexión si la ventana vuelve a estar activa
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            if (!socket || socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
                console.log('La ventana volvió a estar activa. Reiniciando conexión WebSocket...');
                initWebSocket();
            }
        }
    });
});

// Evento de clic en el botón de cambiar usuario
document.getElementById('changeUserBtn').addEventListener('click', function() {
    const newUserId = USER_ID === '1' ? '2' : '1';
    window.location.href = `/?user_id=${newUserId}`;
});
