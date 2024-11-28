from flask import Flask, render_template, request, flash, redirect, url_for, jsonify
from flask_socketio import SocketIO, emit
import json
import spacy
import bcrypt
import google.generativeai as genai
from chatterbot import ChatBot
from chatterbot.trainers import ListTrainer

# Configurações do modelo e segurança
nlp = spacy.load("en_core_web_sm")
genai.configure(api_key='AIzaSyA1AIefRrOxpOD-bmRVajTQlVzSyRifJN8')

generation_config = {
    "temperature": 0.7,
    "top_p": 0.9,
    "top_k": 50,
    "max_output_tokens": 1000,
    "response_mime_type": "text/plain",
}

safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
]

model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    safety_settings=safety_settings,
    generation_config=generation_config,
)

chatbot = ChatBot('ADA')
trainer = ListTrainer(chatbot)
trainer.train([
    "oi", "Olá! Eu sou a ADA, uma Inteligência Artificial focada na área financeira. Como posso te ajudar hoje?",
    "eu queria saber como você está?", "Estou bem, e você?",
    "estou ótimo", "tchau",
])

app = Flask(__name__)
app.config['SECRET_KEY'] = "PALAVRA-SECRETA"
socketio = SocketIO(app)

# Rotas
@app.route("/")
def home():
    return render_template("html/login.html")

@app.route("/login", methods=['POST'])
def login():
    usuario = request.form.get('nome')
    senha = request.form.get('senha')
    with open('usuarios.json') as usuarios:
        lista = json.load(usuarios)
        for c in lista:
            if usuario == c['nome'] and bcrypt.checkpw(senha.encode(), c['senha'].encode()):
                return render_template("html/acesso.html", nomeUsuario=c['nome'])
        flash('Usuário ou senha inválidos')
        return redirect("/")

@app.route("/register", methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        novo_usuario = request.form.get('nome')
        nova_senha = request.form.get('senha')
        hashed_senha = bcrypt.hashpw(nova_senha.encode(), bcrypt.gensalt()).decode()
        with open('usuarios.json', 'r+') as usuarios:
            lista = json.load(usuarios)
            for c in lista:
                if c['nome'] == novo_usuario:
                    flash('Nome de usuário já existe!')
                    return redirect(url_for('register'))
            lista.append({'nome': novo_usuario, 'senha': hashed_senha})
            usuarios.seek(0)
            json.dump(lista, usuarios, indent=4)
            usuarios.truncate()
        flash('Usuário registrado com sucesso!')
        return redirect("/")
    return render_template("html/register.html")

@app.route("/chat", methods=['POST'])
def chat():
    mensagem = request.json.get('mensagem')
    resposta = get_chatbot_response(mensagem)
    return jsonify({'resposta': resposta})

@socketio.on("mensagem")
def handle_message(mensagem):
    for chunk in get_response_chunks(mensagem):
        emit("resposta", chunk, broadcast=True)

def get_chatbot_response(mensagem):
    resposta = chatbot.get_response(mensagem)
    if resposta.confidence < 0.7:
        resposta_gemini = model.generate_content(mensagem)
        candidates = resposta_gemini.candidates
        if candidates:
            return candidates[0].content.parts[0].text.strip()  # Remove espaços extras
        else:
            return "Desculpe, não consegui processar sua solicitação."
    return str(resposta)


def get_response_chunks(mensagem):
    resposta = get_chatbot_response(mensagem)
    for char in resposta:
        yield char

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5001)
