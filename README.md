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
* **Generación de PDFs:** xhtml2pdf + Jinja2 + qrcode (Generación en RAM, sin almacenamiento en disco)
* **Servicio de Correos:** Resend API (vía FastAPI BackgroundTasks)

## ⚙️ Características Principales

1. **Transacciones Atómicas:** Bloqueo temporal de asientos (20 minutos) ligado a `session_id`. Si la compra no finaliza, el asiento se libera automáticamente mediante limpieza pasiva.
2. **Validación de Capacidad de Lotes (Tokens):** El sistema calcula la `capacidad_restante` en tiempo real y rechaza solicitudes en el backend antes del procesamiento (Evita fraude en el cliente).
3. **Generación Dinámica de PDFs:** Los tiquetes no se guardan en el servidor. Se renderizan al vuelo inyectando hashes QR únicos y datos de la base de datos sobre plantillas HTML.
4. **Notificaciones Asíncronas:** El envío de correos con los PDFs adjuntos ocurre en un hilo separado (Background Tasks) para asegurar que el cliente reciba la confirmación en pantalla en milisegundos.
