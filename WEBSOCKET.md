# WebSocket Server - Configuración

## ✅ Problema Resuelto

El servidor WebSocket ahora funciona correctamente utilizando un servidor custom de Next.js.

## Arquitectura

Este proyecto utiliza un **servidor custom de Next.js** (`server.mjs`) que integra:
- Next.js para el renderizado de páginas
- Socket.IO para comunicación en tiempo real
- HTTP server compartido entre ambos

### ¿Por qué un servidor custom?

Next.js 16 con App Router no soporta nativamente Socket.IO en rutas de API. La solución es crear un servidor HTTP personalizado que:

1. Maneja las peticiones HTTP de Next.js
2. Maneja las conexiones WebSocket de Socket.IO
3. Comparte el mismo puerto (3000)

## Configuración Actual

### Archivo: `server.mjs`

```javascript
- Crea servidor HTTP
- Inicializa Next.js app
- Configura Socket.IO en el mismo servidor
- Maneja eventos de juego en tiempo real
```

### Cliente: `lib/store.ts`

```typescript
const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling'],
});
```

**Nota:** Ya NO usa `path: '/api/socket'` porque Socket.IO está en la raíz del servidor.

## Eventos Socket.IO

### Cliente → Servidor
- `create-room` - Crear nueva sala
- `join-room` - Unirse a sala
- `player-ready` - Jugador listo
- `make-move` - Hacer jugada
- `draw-tile` - Robar ficha
- `disconnect` - Desconectar

### Servidor → Cliente
- `room-created` - Sala creada (roomId)
- `room-joined` - Unido a sala (gameState, playerId)
- `game-started` - Juego iniciado
- `game-state-updated` - Estado actualizado
- `player-joined` - Nuevo jugador
- `player-left` - Jugador salió
- `invalid-move` - Jugada inválida
- `error` - Error general

## Comandos

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm run build
npm start
```

## Verificar Conexión

1. Abre la consola del navegador (F12)
2. Busca mensajes como:
   - "Connected to socket server"
   - "Client connected: [socket-id]"

3. En la terminal del servidor verás:
   - "> Ready on http://localhost:3000"
   - "> Socket.IO server running"
   - "Client connected: [socket-id]"

## Troubleshooting

### El cliente no conecta

**Síntomas:** No ves "Connected to socket server" en la consola

**Solución:**
1. Verifica que el servidor esté corriendo: `npm run dev`
2. Revisa la consola del servidor para errores
3. Asegúrate que el puerto 3000 no esté ocupado
4. Limpia caché del navegador y recarga

### Error: "ERR_CONNECTION_REFUSED"

**Causa:** El servidor no está corriendo o puerto bloqueado

**Solución:**
```bash
# Matar proceso en puerto 3000
lsof -ti:3000 | xargs kill -9

# Reiniciar servidor
npm run dev
```

### Socket.IO no envía eventos

**Causa:** El evento no está registrado correctamente

**Solución:**
1. Verifica que el evento exista en `server.mjs`
2. Revisa que el nombre del evento coincida exactamente
3. Checa la consola del servidor para errores

## Estado Actual

✅ **Funcionando correctamente**

El servidor WebSocket está:
- ✅ Corriendo en http://localhost:3000
- ✅ Aceptando conexiones Socket.IO
- ✅ Manejando eventos de juego
- ✅ Sincronizando estado entre jugadores
- ✅ Soportando múltiples salas

## Logs del Servidor

Cuando todo funciona correctamente verás:

```
> domino@0.1.0 dev
> node server.mjs

> Ready on http://localhost:3000
> Socket.IO server running
Client connected: abc123xyz
Room created: XYZ789
Player Player1 joined room XYZ789
Game started in room: XYZ789
```

## Próximos Pasos

Para producción, considera:

1. **Variables de entorno** para la URL del servidor
2. **SSL/TLS** para conexiones seguras (wss://)
3. **Autenticación** de jugadores
4. **Rate limiting** para prevenir spam
5. **Monitoreo** de conexiones activas
6. **Backup** de salas activas
7. **Scaling** con Redis para múltiples instancias

---

**El servidor WebSocket está completamente funcional** 🎉
