# Grupo Turístico - Sistema de Reservas y Emisión de Tiquetes

Sistema transaccional de alto rendimiento diseñado para la gestión de viajes, reserva atómica de asientos y emisión en tiempo real de pases de abordaje. Implementa bloqueos concurrentes (optimistic locking) para evitar sobreventa y colas de tareas en segundo plano para notificaciones por correo.

## 🚀 Arquitectura y Stack Tecnológico

El proyecto está dividido en dos microservicios principales contenerizados:

**Frontend (Client-Facing & Admin Panel)**
* **Framework:** Next.js (React)
* **Estilos:** Tailwind CSS + Shadcn UI
* **Iconografía:** Lucide React

**Backend (Core API & Generación de Documentos)**
* **Framework:** FastAPI (Python)
* **ORM & Base de Datos:** SQLAlchemy + PostgreSQL (Supabase)
* **Generación de PDFs:** xhtml2pdf + Jinja2 + qrcode (Generación en RAM para tiquetes y manifiestos, sin almacenamiento en disco)
* **Servicio de Correos:** Resend API (vía FastAPI BackgroundTasks)

## ⚙️ Características Principales

1. **Transacciones Atómicas:** Bloqueo temporal de asientos (5 minutos) ligado a `session_id`. Si la compra no finaliza, el asiento se libera automáticamente mediante limpieza pasiva.
2. **Validación de Capacidad de Lotes (Tokens):** El sistema calcula la `capacidad_restante` en tiempo real y rechaza solicitudes en el backend antes del procesamiento (Evita fraude en el cliente).
3. **Generación Dinámica de PDFs:** Los tiquetes y manifiestos de pasajeros se renderizan al vuelo inyectando hashes QR únicos y datos de la base de datos sobre plantillas HTML.
4. **Notificaciones Asíncronas:** El envío de correos con los PDFs adjuntos ocurre en un hilo separado (Background Tasks) para asegurar que el cliente reciba la confirmación en pantalla en milisegundos.
5. **Gestión de Abonos (Layaway):** Módulo paralelo de control financiero para pagos fraccionados. Registra el historial de pagos y genera el pase de abordar únicamente al completar el 100% del saldo.
6. **Centro de Control Logístico:** Vista administrativa con mapa de asientos interactivo que cruza la ocupación física con métricas financieras calculadas al vuelo (Ingreso Bruto, Lucro Cesante y Rendimiento % de ocupación).
7. **Gestión del Ciclo de Vida:** Interceptores y filtros a nivel ORM que bloquean transacciones y ocultan automáticamente la data de viajes finalizados o cancelados, manteniendo intacto el historial para futuras analíticas.
