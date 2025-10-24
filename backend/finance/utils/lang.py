from langdetect import detect, detect_langs, DetectorFactory

DetectorFactory.seed = 0

PT_ALIASES = {"pt", "pt-br", "pt_br", "pt-BR"}

def detect_language(prompt: str) -> tuple[str, float]:
    try:
        cands = detect_langs(prompt or "")
        if not cands:
            return ("unknown", 0.0)
        best = max(cands, key=lambda x: x.prob)
        lang = best.lang.lower()
        if lang in PT_ALIASES:
            lang = "pt"
        return (lang, float(best.prob))
    except Exception:
        try:
            lang = (detect(prompt or "") or "").lower()
            if lang in PT_ALIASES:
                lang = "pt"
            return (lang if lang else "unknown", 0.0)
        except Exception:
            return ("unknown", 0.0)

def is_portuguese(prompt: str, min_prob: float = 0.70) -> bool:
    lang, prob = detect_language(prompt)
    return lang == "pt" and prob >= min_prob

def detect_lang_code(text: str) -> str | None:
    lang, _ = detect_language(text)
    return None if lang == "unknown" else lang
