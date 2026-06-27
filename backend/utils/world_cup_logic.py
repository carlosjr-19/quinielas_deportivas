import json
import os
import re
from datetime import datetime

def parse_score(score):
    if score and "ft" in score:
        return score["ft"][0], score["ft"][1]
    return None, None

def _is_valid_team(team_name):
    if not team_name:
        return False
    # Ignorar placeholders como 1A, 2B, 3A/B/C, W73, L101
    if re.match(r'^[12][A-L]$', team_name): return False
    if team_name.startswith('3'): return False
    if re.match(r'^[WL]\d+$', team_name): return False
    return True

def calcular_posiciones_grupos(partidos_json):
    grupos = {}
    
    # 1. Recolectar datos básicos
    for p in partidos_json:
        grupo = p.get("group")
        if not grupo:
            continue
            
        t1 = p.get("team1", "")
        t2 = p.get("team2", "")
        
        if grupo not in grupos:
            grupos[grupo] = {}
            
        if _is_valid_team(t1) and t1 not in grupos[grupo]:
            grupos[grupo][t1] = {"equipo": t1, "PJ": 0, "PG": 0, "PE": 0, "PP": 0, "GF": 0, "GC": 0, "DG": 0, "Pts": 0, "matches": {}}
        if _is_valid_team(t2) and t2 not in grupos[grupo]:
            grupos[grupo][t2] = {"equipo": t2, "PJ": 0, "PG": 0, "PE": 0, "PP": 0, "GF": 0, "GC": 0, "DG": 0, "Pts": 0, "matches": {}}
            
        gl, gv = parse_score(p.get("score"))
        if gl is not None and gv is not None and t1 in grupos[grupo] and t2 in grupos[grupo]:
            # Registrar resultado
            grupos[grupo][t1]["PJ"] += 1
            grupos[grupo][t1]["GF"] += gl
            grupos[grupo][t1]["GC"] += gv
            grupos[grupo][t1]["DG"] += (gl - gv)
            grupos[grupo][t1]["matches"][t2] = {"gl": gl, "gv": gv}
            
            grupos[grupo][t2]["PJ"] += 1
            grupos[grupo][t2]["GF"] += gv
            grupos[grupo][t2]["GC"] += gl
            grupos[grupo][t2]["DG"] += (gv - gl)
            grupos[grupo][t2]["matches"][t1] = {"gl": gv, "gv": gl}
            
            if gl > gv:
                grupos[grupo][t1]["PG"] += 1
                grupos[grupo][t1]["Pts"] += 3
                grupos[grupo][t2]["PP"] += 1
            elif gl < gv:
                grupos[grupo][t2]["PG"] += 1
                grupos[grupo][t2]["Pts"] += 3
                grupos[grupo][t1]["PP"] += 1
            else:
                grupos[grupo][t1]["PE"] += 1
                grupos[grupo][t2]["PE"] += 1
                grupos[grupo][t1]["Pts"] += 1
                grupos[grupo][t2]["Pts"] += 1

    # 2. Ordenar con criterios: 1. Pts, 2. Enfrentamiento directo, 3. DG, 4. GF
    grupos_ordenados = []
    for g_name, g_teams in grupos.items():
        teams_list = list(g_teams.values())
        
        # Para el enfrentamiento directo, necesitamos poder comparar 2 equipos
        def compare_teams(tA, tB):
            # 1. Puntos
            if tA["Pts"] != tB["Pts"]:
                return tA["Pts"] - tB["Pts"]
                
            # 2. Enfrentamiento directo
            h2h_A = tA["matches"].get(tB["equipo"])
            if h2h_A:
                pts_A = 0
                pts_B = 0
                if h2h_A["gl"] > h2h_A["gv"]: pts_A = 3
                elif h2h_A["gl"] < h2h_A["gv"]: pts_B = 3
                else: pts_A = 1; pts_B = 1
                
                if pts_A != pts_B:
                    return pts_A - pts_B
                    
            # 3. Diferencia de goles general
            if tA["DG"] != tB["DG"]:
                return tA["DG"] - tB["DG"]
                
            # 4. Goles a favor general
            return tA["GF"] - tB["GF"]

        from functools import cmp_to_key
        teams_list.sort(key=cmp_to_key(compare_teams), reverse=True)
        
        # Remover campo 'matches' temporal
        for t in teams_list:
            t.pop("matches", None)
            
        grupos_ordenados.append({
            "nombre": g_name,
            "equipos": teams_list
        })
        
    grupos_ordenados.sort(key=lambda x: x["nombre"])
    return grupos_ordenados

def actualizar_json_mundial(partido_id, goles_local, goles_visitante, avanza_real):
    json_path = os.path.join(os.path.dirname(__file__), "..", "db", "world_cup.json")
    if not os.path.exists(json_path):
        return
        
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    partidos = data.get("matches", [])
    
    # 1. Buscar y actualizar el partido específico
    partido_modificado = None
    for i, p in enumerate(partidos):
        # El partido_id que tenemos en BD tiene el formato: "WC-2026-match-{i+1}"
        expected_id = f"WC-2026-match-{i+1}"
        if expected_id == partido_id:
            if goles_local is None or goles_visitante is None:
                p.pop("score", None)
                p.pop("advances", None)
            else:
                if "score" not in p:
                    p["score"] = {}
                p["score"]["ft"] = [goles_local, goles_visitante]
                
                # Guardar quien avanzó si es eliminatoria
                if avanza_real:
                    p["advances"] = avanza_real
                
            partido_modificado = p
            break
            
    if not partido_modificado:
        return # No se encontró
        
    if partido_modificado.get("num"):
        num_partido = str(partido_modificado["num"])
        ganador = avanza_real
        if not ganador and goles_local is not None and goles_visitante is not None:
            if goles_local > goles_visitante:
                ganador = partido_modificado.get("team1")
            elif goles_local < goles_visitante:
                ganador = partido_modificado.get("team2")
                
        perdedor = None
        if ganador:
            if ganador == partido_modificado.get("team1"):
                perdedor = partido_modificado.get("team2")
            elif ganador == partido_modificado.get("team2"):
                perdedor = partido_modificado.get("team1")
            
            # Buscar partidos futuros que requieran este ganador o perdedor
            for p in partidos:
                # Inicializar original_team si no existe
                if "original_team1" not in p: p["original_team1"] = p.get("team1")
                if "original_team2" not in p: p["original_team2"] = p.get("team2")
                
                if p.get("original_team1") == f"W{num_partido}": p["team1"] = ganador
                if p.get("original_team2") == f"W{num_partido}": p["team2"] = ganador
                if perdedor and p.get("original_team1") == f"L{num_partido}": p["team1"] = perdedor
                if perdedor and p.get("original_team2") == f"L{num_partido}": p["team2"] = perdedor
        else:
            # Si no hay ganador (partido des-finalizado), restaurar placeholders
            for p in partidos:
                if "original_team1" in p and p.get("original_team1") == f"W{num_partido}": p["team1"] = p["original_team1"]
                if "original_team2" in p and p.get("original_team2") == f"W{num_partido}": p["team2"] = p["original_team2"]
                if "original_team1" in p and p.get("original_team1") == f"L{num_partido}": p["team1"] = p["original_team1"]
                if "original_team2" in p and p.get("original_team2") == f"L{num_partido}": p["team2"] = p["original_team2"]
                
    # 3. Evaluar fase de grupos y propagar 1ros y 2dos
    grupos_calc = calcular_posiciones_grupos(partidos)
    grupos_finalizados = {}
    terceros = []
    
    for g in grupos_calc:
        # Verificar si todos los partidos del grupo están terminados
        nombre_g = g["nombre"] # ej "Group A"
        letra_g = nombre_g.split(" ")[1] if " " in nombre_g else ""
        
        partidos_del_grupo = [p for p in partidos if p.get("group") == nombre_g]
        todos_terminados = True
        for p in partidos_del_grupo:
            gl, gv = parse_score(p.get("score"))
            if gl is None:
                todos_terminados = False
                break
                
        if todos_terminados and len(g["equipos"]) >= 3:
            grupos_finalizados[letra_g] = g["equipos"]
            terceros.append(g["equipos"][2]) # Añadir al tercero a la lista global
            
    # Asignar 1ros y 2dos o restaurar si no está finalizado
    letras_todas = [g["nombre"].split(" ")[1] for g in grupos_calc if " " in g["nombre"]]
    for letra_g in letras_todas:
        if letra_g in grupos_finalizados:
            equipos = grupos_finalizados[letra_g]
            t1 = equipos[0]["equipo"]
            t2 = equipos[1]["equipo"]
            
            for p in partidos:
                if "original_team1" not in p: p["original_team1"] = p.get("team1")
                if "original_team2" not in p: p["original_team2"] = p.get("team2")
                
                if p.get("original_team1") == f"1{letra_g}": p["team1"] = t1
                if p.get("original_team2") == f"1{letra_g}": p["team2"] = t1
                if p.get("original_team1") == f"2{letra_g}": p["team1"] = t2
                if p.get("original_team2") == f"2{letra_g}": p["team2"] = t2
        else:
            # El grupo no está finalizado, restaurar placeholders
            for p in partidos:
                if "original_team1" in p and p.get("original_team1") == f"1{letra_g}": p["team1"] = p["original_team1"]
                if "original_team2" in p and p.get("original_team2") == f"1{letra_g}": p["team2"] = p["original_team2"]
                if "original_team1" in p and p.get("original_team1") == f"2{letra_g}": p["team1"] = p["original_team1"]
                if "original_team2" in p and p.get("original_team2") == f"2{letra_g}": p["team2"] = p["original_team2"]

    # 4. Asignar mejores 3ros si todos los grupos están terminados
    if len(grupos_finalizados) == 12: # El mundial 2026 tiene 12 grupos A-L
        # Ordenar los terceros: 1. Pts, 2. DG, 3. GF
        terceros.sort(key=lambda x: (x["Pts"], x["DG"], x["GF"]), reverse=True)
        mejores_8 = terceros[:8]
        equipos_terceros_clasificados = [t["equipo"] for t in mejores_8]
        
        # Como la regla exacta de asignación de los 8 mejores 3ros depende de combinaciones 
        # y la matriz oficial de FIFA, usaremos una asignación heurística a los placeholders disponibles.
        # En world_cup.json, los placeholders son "3A/B/C..."
        placeholders_3ros = []
        for p in partidos:
            if "original_team1" not in p: p["original_team1"] = p.get("team1")
            if "original_team2" not in p: p["original_team2"] = p.get("team2")
            
            t1_orig = p.get("original_team1", "")
            if t1_orig and t1_orig.startswith("3") and "/" in t1_orig:
                placeholders_3ros.append((p, "team1", t1_orig))
                
            t2_orig = p.get("original_team2", "")
            if t2_orig and t2_orig.startswith("3") and "/" in t2_orig:
                placeholders_3ros.append((p, "team2", t2_orig))
                
        # Asignación simple: iterar sobre los 8 mejores y asignar al primer placeholder compatible
        for equipo_t3 in mejores_8:
            letra_origen = ""
            for g_name, g_teams in grupos_calc:
                if g_teams[2]["equipo"] == equipo_t3["equipo"]:
                    letra_origen = g_name.split(" ")[1]
                    break
                    
            for p_obj, team_key, orig_val in placeholders_3ros:
                if orig_val.startswith("3") and "/" in orig_val:
                    # Verifica si el placeholder permite equipos de esta letra (ej. "3A/B/C/D/F")
                    if letra_origen in orig_val:
                        p_obj[team_key] = equipo_t3["equipo"]
                        break
    else:
        # Restaurar todos los placeholders de 3ros si no están todos los grupos
        for p in partidos:
            t1_orig = p.get("original_team1", "")
            if t1_orig and t1_orig.startswith("3") and "/" in t1_orig:
                p["team1"] = t1_orig
            t2_orig = p.get("original_team2", "")
            if t2_orig and t2_orig.startswith("3") and "/" in t2_orig:
                p["team2"] = t2_orig
    
    # Escribir de vuelta al archivo
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
