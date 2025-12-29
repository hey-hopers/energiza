import PyPDF2
import json

def extract_invoice_data(file_path: str) -> str:

    dados = {
        "arquivo": file_path,
        "unidadeConsumo": "",
        "referencia": "",
        "vencimento": "",
        "data_leitura_anterior": "",
        "data_leitura_atual": "",
        "data_leitura_proxima": "",
        "diasLidos": "",
        "medidor": "",
        "leituraAnterior": "",
        "leituraAtual": "",
        "totalApurado": "",
        "itens": [],
        "valorTotal": 0.0
    }

    valor_total = 0.0

    try:
        with open(file_path, 'rb') as arquivo:
            leitor = PyPDF2.PdfReader(arquivo)
            texto_total = ""

            for i, pagina in enumerate(leitor.pages):
                texto = pagina.extract_text() or ""
                texto_total += f"\n--- Página {i + 1} ---\n{texto}"

        linhas = texto_total.splitlines()

        for i, linha in enumerate(linhas):
            linha_strip = linha.strip()

            # Itens faturados
            if linha_strip.startswith(("(0R)", "(0S)", "(2M)", "(2V)")) and "KWH" in linha_strip:
                try:
                    p = linha_strip.find("KWH")
                    col = linha_strip[p + 3:].split()

                    qtd = float(col[0].replace('.', '').replace(',', '.'))
                    valor = float(col[2][1:].replace('.', '').replace(',', '.'))

                    dados["itens"].append({
                        "item": linha_strip[:p - 4].strip(),
                        "unidade": "KWH",
                        "quantidade": qtd,
                        "valor": valor
                    })

                    valor_total += valor
                except (IndexError, ValueError):
                    pass  # ignora linha mal formatada

            # Dados fixos por posição (mantido, mas protegido)
            elif i == 3:
                dados["unidadeConsumo"] = linha_strip

            elif i == 5 and len(linha_strip) >= 18:
                dados["referencia"] = linha_strip[:7]
                dados["vencimento"] = linha_strip[8:18]

            elif i == 10:
                dados["data_leitura_anterior"] = linha_strip[:10]
                dados["data_leitura_atual"] = linha_strip[11:21]
                dados["diasLidos"] = linha_strip[22:24]

                if "SERIE" in linha_strip:
                    col = linha_strip.split()
                    if len(col) >= 4:
                        dados["data_leitura_proxima"] = col[3][:10]

            # Medidor
            elif "Energia" in linha_strip and "Único" in linha_strip:
                col = linha_strip.split()
                if len(col) >= 8:
                    dados["medidor"] = col[0]
                    dados["leituraAnterior"] = col[3]
                    dados["leituraAtual"] = col[4]
                    dados["totalApurado"] = col[7]

        dados["valorTotal"] = round(valor_total, 2)
        return json.dumps(dados, indent=4, ensure_ascii=False)

    except FileNotFoundError:
        return json.dumps({"erro": "Arquivo não encontrado"}, ensure_ascii=False)

    except Exception as e:
        return json.dumps({"erro": f"Erro ao ler o PDF: {e}"}, ensure_ascii=False)