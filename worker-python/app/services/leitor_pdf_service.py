import pdfplumber
import os
import PyPDF2
import json

def extract_invoice_data(file_path: str) -> dict:
    data = {}

    try:
        with open(file_path, 'rb') as arquivo:
            
            leitor = PyPDF2.PdfReader(arquivo)
            texto_total = ''
            
            for i, pagina in enumerate(leitor.pages):
                texto = pagina.extract_text()
                texto_total += f'\n--- Página {i + 1} ---\n'
                texto_total += texto if texto else '[Sem texto detectado]\n'

            linhas = texto_total.splitlines()
            valor_total = 0
            dados = {
                "arquivo": "",
                "unidadeConsumo": "",
                "referencia": "",
                "vencimento": "",
                "data_leitura_anterior": "",
                "data_leitura_atual": "",
                "data_leitura_proxima": "",
                "diasLidos": "",
                "medidor": "",
                "diasLidos": "",
                "leituraAnterior": "",
                "leituraAtual": "",
                "totalApurado": "",
                "itens": [],
                "valorTotal": 0.0
            }

            for i, linha in enumerate(linhas):
                linha_strip = linha.strip()

                if linha_strip.startswith("(0R)") or linha_strip.startswith("(0S)") or linha_strip.startswith("(2M)") or linha_strip.startswith("(2V)"):
                    p = linha_strip.find("KWH")
                    if p != -1:
                        col = linha_strip[p + 3:].split()
                        valor_str = col[2][1:]  
                        valor_float = float(valor_str.replace('.', '').replace(',', '.'))
    
                        qtd_float = float(col[0].replace('.', '').replace(',', '.'))

                        dados["itens"].append({ 
                            "item": linha_strip[:p - 4],
                            "unidade": linha_strip[p:p + 3],
                            "quantidade": qtd_float,
                            "valor": valor_float
                        })

                        valor_total += valor_float

                elif i == 3:
                    unidade = linha_strip 

                elif i == 5:
                    referencia = linha_strip[:7]
                    vencimento = linha_strip[8:18]


                elif i == 10:
                    anterior = linha_strip[:10] 
                    atual = linha_strip[11:21] 
                    dias = linha_strip[22:24]

                    p = linha_strip.find("SERIE")
                    if p != -1:
                        col = linha_strip.split()
                        proxima = col[3][:10]
                
                elif linha_strip.find("Energia") != -1 and linha_strip.find("Único") != -1:
                    col = linha_strip.split()            
                    medidor = col[0]
                    leituraAnterior = col[3]
                    leituraAtual = col[4]
                    totalApurado = col[7]

            # Atualiza o valor total no dicionário final
            dados["arquivo"] = caminho_completo
            dados["unidadeConsumo"] = unidade
            dados["referencia"] = referencia
            dados["vencimento"] = vencimento
            dados["data_leitura_anterior"] = anterior
            dados["data_leitura_atual"] = atual
            dados["data_leitura_proxima"] = proxima
            dados["diasLidos"] = dias   
            dados["medidor"] = medidor
            dados["leituraAnterior"] = leituraAnterior
            dados["leituraAtual"] = leituraAtual
            dados["totalApurado"] = totalApurado     
            dados["valorTotal"] = round(valor_total, 2)       

            return json.dumps(dados, indent=4, ensure_ascii=False)

    except FileNotFoundError:
        return data["raw_text"] = 'Arquivo não encontrado.'

    except Exception as e:
        return data["raw_text"] = f'Erro ao ler o PDF: {e}'