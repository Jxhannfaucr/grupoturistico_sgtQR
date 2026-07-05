import os
import io
import base64
import qrcode
import resend
import gc
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa
from dotenv import load_dotenv

load_dotenv()
resend.api_key = os.getenv("RESEND_API_KEY")
email_from = os.getenv("EMAIL_FROM")

def generar_pdf_memoria(viaje, tickets_db):
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

    templates_dir = os.path.join(os.path.dirname(__file__), "../templates")
    env = Environment(loader=FileSystemLoader(templates_dir))
    template = env.get_template("tiquete.html")

    fecha_str = viaje.fecha_salida.strftime("%d/%m/%Y") if viaje.fecha_salida else "--"
    hora_str = viaje.hora_salida.strftime("%I:%M %p") if viaje.hora_salida else "--"

    # ─── LÓGICA DE LOGO REACTIVADA Y OPTIMIZADA ───
    logo_path = os.path.join(templates_dir, "logo_optimizado.jpg")
    try:
        with open(logo_path, "rb") as f:
            logo_b64 = base64.b64encode(f.read()).decode("utf-8")
    except FileNotFoundError:
        # Prevención de fallos: si olvidas subir la imagen, el PDF se genera sin logo pero no se cae el sistema
        logo_b64 = ""
        print("Advertencia: No se encontró logo_optimizado.jpg")

    html_renderizado = template.render(
        viaje={"nombre": viaje.nombre, "fecha_salida": fecha_str, "hora_salida": hora_str},
        tickets=tickets_data,
        logo_b64=logo_b64
    )
    # ──────────────────────────────────────────────

    pdf_file = io.BytesIO()
    pisa.CreatePDF(io.StringIO(html_renderizado), dest=pdf_file)
    return pdf_file.getvalue()

def enviar_tiquetes_async(email_destino: str, viaje, tickets_db):
    try:
        pdf_bytes = generar_pdf_memoria(viaje, tickets_db)
        pdf_content = list(pdf_bytes)

        params = {
            "from": f"Grupo Turístico <{email_from}>",
            "to": [email_destino],
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
        
        email = resend.Emails.send(params)
        print(f"Correo enviado exitosamente a {email_destino}: {email}")
        
    except Exception as e:
        print(f"Error crítico enviando correo a {email_destino}: {str(e)}")
    
    finally:
        # LÓGICA DE LIMPIEZA FORZADA DE MEMORIA (Mitigación de OOM)
        if 'pdf_bytes' in locals(): del pdf_bytes
        if 'pdf_content' in locals(): del pdf_content
        gc.collect()