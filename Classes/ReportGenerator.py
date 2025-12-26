from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
import matplotlib
matplotlib.use('Agg') # Set non-interactive backend
import matplotlib.pyplot as plt
import os
import time

class ReportGenerator:
    PRECAUTIONS = {
        "COVID-19": [
            "Isolate immediately to prevent spread.",
            "Monitor oxygen levels regularly.",
            "Consult a doctor for antiviral medication.",
            "Rest and stay hydrated."
        ],
        "PNEUMONIA": [
            "Complete the full course of antibiotics if prescribed.",
            "Drink plenty of fluids to loosen secretions.",
            "Use a humidifier to keep air moist.",
            "Rest and avoid strenuous activity."
        ],
        "TUBERCULOSIS": [
            "Strictly adhere to the long-term medication regimen.",
            "Ensure good ventilation in living spaces.",
            "Cover mouth while coughing to protect others.",
            "Eat a nutritious diet to boost immunity."
        ],
        "NORMAL": [
            "Maintain a healthy lifestyle.",
            "Avoid smoking and pollutants.",
            "Exercise regularly to improve lung capacity.",
            "Go for regular health check-ups."
        ]
    }

    @staticmethod
    def generate_graph(probabilities, output_path):
        """
        Generates a bar graph of disease probabilities.
        probabilities: dict like {'COVID-19': 0.1, 'NORMAL': 0.8, ...}
        """
        try:
            diseases = list(probabilities.keys())
            probs = list(probabilities.values())

            plt.figure(figsize=(6, 4))
            bars = plt.bar(diseases, probs, color=['#ff9999', '#66b3ff', '#99ff99', '#ffcc99'])
            plt.xlabel('Disease')
            plt.ylabel('Confidence Score')
            plt.title('Disease Probability Distribution')
            plt.ylim(0, 1)
            
            for bar in bars:
                yval = bar.get_height()
                plt.text(bar.get_x() + bar.get_width()/2, yval, round(yval, 2), va='bottom')

            plt.savefig(output_path)
            plt.close()
            return output_path
        except Exception as e:
            print(f"Error generating graph: {e}")
            return None

    @staticmethod
    def determine_stage(prediction, confidence):
        if prediction == "NORMAL":
            return "Healthy", colors.green
        
        if confidence < 0.70:
            return "Early Stage (Stage 1)", colors.orange
        elif confidence < 0.85:
            return "Moderate (Stage 2)", colors.orange
        elif confidence < 0.95:
            return "Severe (Stage 3)", colors.red
        else:
            return "Critical (Stage 4)", colors.red

    @staticmethod
    def generate_pdf(patient_data, prediction, confidence, probabilities, image_path, graph_path, output_filename):
        try:
            c = canvas.Canvas(output_filename, pagesize=letter)
            width, height = letter

            # --- Logo ---
            logo_path = "resources/logo.png"
            if os.path.exists(logo_path):
                try:
                    # Draw logo centered at the top
                    logo_width = 150
                    logo_height = 50
                    c.drawImage(logo_path, (width - logo_width) / 2, height - 80, width=logo_width, height=logo_height, preserveAspectRatio=True, mask='auto')
                except Exception as e:
                    print(f"Error drawing logo: {e}")

            # --- Header ---
            c.setFillColor(colors.darkblue)
            c.setFont("Helvetica-Bold", 20)
            c.drawCentredString(width / 2, height - 110, "Lung Disease Classification Report")
            
            c.setFillColor(colors.black)
            c.setFont("Helvetica", 10)
            c.drawCentredString(width / 2, height - 130, f"Date: {time.strftime('%Y-%m-%d %H:%M:%S')}")
            c.line(50, height - 140, width - 50, height - 140)

            # --- Patient Details ---
            y_pos = height - 180
            c.setFont("Helvetica-Bold", 14)
            c.drawString(50, y_pos, "Patient Details")
            y_pos -= 25
            
            c.setFont("Helvetica", 12)
            c.drawString(50, y_pos, f"Patient ID: {patient_data.get('id', 'N/A')}")
            c.drawString(300, y_pos, f"Name: {patient_data.get('name', 'N/A')}")
            y_pos -= 20
            c.drawString(50, y_pos, f"Age: {patient_data.get('age', 'N/A')}")
            c.drawString(300, y_pos, f"History: {patient_data.get('history', 'N/A')}")
            
            # --- Diagnosis ---
            y_pos -= 50
            c.setFont("Helvetica-Bold", 14)
            c.drawString(50, y_pos, "Diagnosis Result")
            y_pos -= 30
            
            # Get Stage and Color
            stage, color = ReportGenerator.determine_stage(prediction, confidence)
            
            c.setFillColor(color)
            c.setFont("Helvetica-Bold", 18)
            c.drawString(50, y_pos, f"{prediction} ({confidence:.2%} confidence)")
            
            y_pos -= 25
            c.setFont("Helvetica-Bold", 16)
            c.drawString(50, y_pos, f"Condition: {stage}")
            
            c.setFillColor(colors.black)

            # --- Images ---
            y_pos -= 250
            # X-Ray Image
            if os.path.exists(image_path):
                c.drawImage(image_path, 50, y_pos, width=250, height=200, preserveAspectRatio=True)
                c.setFont("Helvetica-Oblique", 10)
                c.drawString(50, y_pos - 15, "Enhanced X-Ray Scan")

            # Probability Graph
            if graph_path and os.path.exists(graph_path):
                c.drawImage(graph_path, 320, y_pos, width=250, height=200, preserveAspectRatio=True)
                c.drawString(320, y_pos - 15, "Probability Analysis")

            # --- Precautions ---
            y_pos -= 50
            c.setFont("Helvetica-Bold", 14)
            c.drawString(50, y_pos, "Recommended Precautions")
            y_pos -= 25
            c.setFont("Helvetica", 12)
            
            precautions = ReportGenerator.PRECAUTIONS.get(prediction, ["Consult a doctor usually."])
            for i, p in enumerate(precautions, 1):
                c.drawString(50, y_pos, f"{i}. {p}")
                y_pos -= 20

            # --- Footer ---
            c.setFont("Helvetica-Oblique", 8)
            c.drawString(50, 50, "* This report is generated by AI and should be verified by a medical professional.")
            
            c.save()
            return output_filename
        except Exception as e:
            print(f"Error generating PDF: {e}")
            return None
