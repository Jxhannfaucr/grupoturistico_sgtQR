import os
import io
import base64
import qrcode
import resend
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()
resend.api_key = os.getenv("RESEND_API_KEY")
email_from = os.getenv("EMAIL_FROM")

def generar_pdf_memoria(viaje, tickets_db):
    """Genera el PDF en memoria (RAM) sin guardarlo en el disco duro."""
    tickets_data = []
    for t in tickets_db:
        qr = qrcode.QRCode(version=1, box_size=5, border=1)
        qr.add_data(t.qr_hash)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

        tickets_data.append({
            "nombre_pasajero": t.nombre_pasajero,
            "lugar_abordaje": t.punto_abordaje_pasajero or viaje.lugar_abordaje,
            "numero_asiento": t.asiento.numero,
            "qr_base64": img_b64
        })

    env = Environment(loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), "../templates")))
    template = env.get_template("tiquete.html")
    
    fecha_str = viaje.fecha_salida.strftime("%d/%m/%Y") if viaje.fecha_salida else "--"
    hora_str = viaje.hora_salida.strftime("%I:%M %p") if viaje.hora_salida else "--"

    html_renderizado = template.render(
        viaje={"nombre": viaje.nombre, "fecha_salida": fecha_str, "hora_salida": hora_str},
        tickets=tickets_data
    )

    pdf_file = io.BytesIO()
    pisa.CreatePDF(io.StringIO(html_renderizado), dest=pdf_file)
    return pdf_file.getvalue()

def enviar_tiquetes_async(email_destino: str, viaje, tickets_db):
    """Función que será ejecutada en segundo plano por FastAPI."""
    try:
        # 1. Generamos el PDF
        pdf_bytes = generar_pdf_memoria(viaje, tickets_db)
        
        # 2. Convertimos los bytes en una lista (Requisito de la librería de Resend en Python)
        pdf_content = list(pdf_bytes)

        # 3. Configuramos el correo
        params = {
            "from": f"Grupo Turístico <{email_from}>", # Cambiar al verificar dominio
            "to": [email_destino], # Para pruebas, DEBE ser el correo con el que creaste tu cuenta en Resend
            "subject": f"Tus Tiquetes Confirmados - {viaje.nombre}",
            "html": f"""
            <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #ea580c;">¡Reserva Confirmada!</h2>
                <p>Hola,</p>
                <p>Tu compra para el viaje a <strong>{viaje.nombre}</strong> se ha procesado con éxito.</p>
                <p>Adjunto a este correo encontrarás tus pases de abordaje en formato PDF. Recuerda tenerlos a mano (impresos o en tu celular) el día del viaje.</p>
                <br>
                <p>Gracias por viajar con Grupo Turístico.</p>
            </div>
            """,
            "attachments": [
                {
                    "filename": f"Tiquetes_{viaje.nombre.replace(' ', '_')}.pdf",
                    "content": pdf_content
                }
            ]
        }
        
        # 4. Enviar a través de Resend
        email = resend.Emails.send(params)
        print(f"Correo enviado exitosamente a {email_destino}: {email}")
        
    except Exception as e:
        # En segundo plano, solo imprimimos el error para no botar el sistema
        print(f"Error crítico enviando correo a {email_destino}: {str(e)}")