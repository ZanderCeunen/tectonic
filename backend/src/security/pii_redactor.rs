use regex::Regex;
use std::sync::LazyLock;

// Regex voor Belgisch Rijksregisternummer (RRN):
// Ondersteunt separators: punt, slash, spatie, koppelteken, en-dash, of geen separator.
// bv. 85.04.12-123.45, 85/04/12/123/45, 85/04/12-123.45, 85041212345
static RRN_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"\b(\d{2})[./\s\-–]?(\d{2})[./\s\-–]?(\d{2})[./\s\-–]?(\d{3})[./\s\-–]?(\d{2})\b").unwrap()
});

// Regex voor alle geldige IBAN-formaten (inclusief spaties, punten, streepjes, unspaced, lowercase en internationale prefixes):
// e.g. BE68 5390 0754 7034, BE68.5390.0754.7034, BE68-5390-0754-7034, be68 5390 0754 7034, BE68539007547034, NL91 ABNA 0417 1643 00, FR14..., DE89...
static IBAN_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)\b[a-z]{2}\d{2}(?:[.\-\s]?[a-z0-9]{4}){2,7}(?:[.\-\s]?[a-z0-9]{1,4})?\b").unwrap()
});

// Regex voor salarisbedragen inclusief voorvoegsels én achtervoegsels (zoals gross per month, bruto per maand, EUR/maand, etc.):
static SALARY_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)(?:(?:bruto|netto|gross|net|wedde|salaris|loon|salary|wage)\s?:?\s?)?(?:€|EUR|euro)\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?(?:\s?(?:euro|EUR|€|gross|net|bruto|netto)?\s?(?:per\s+(?:month|maand|hour|uur|year|jaar)|/(?:month|maand|hour|uur|year|jaar|m|u|h|y)|maandloon|jaarloon|uurloon))?|\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?\s?(?:euro|EUR|€)\s?(?:gross|net|bruto|netto)?\s?(?:per\s+(?:month|maand|hour|uur|year|jaar)|/(?:month|maand|hour|uur|year|jaar|m|u|h|y)|maandloon|jaarloon|uurloon)?\b|\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?\s?(?:gross|net|bruto|netto)\s?(?:per\s+(?:month|maand|hour|uur|year|jaar)|/(?:month|maand|hour|uur|year|jaar|m|u|h|y)|maandloon|jaarloon|uurloon)?\b|\b(?:bruto|netto|wedde|salaris|loon|salary|wage)\s?:?\s?(?:€|EUR)?\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?(?:\s?(?:gross|net|bruto|netto)?\s?(?:per\s+(?:month|maand|hour|uur|year|jaar)|/(?:month|maand|hour|uur|year|jaar|m|u|h|y)|maandloon|jaarloon|uurloon))?\b").unwrap()
});

pub struct PiiRedactor;

impl PiiRedactor {
    /// Maskeert gevoelige data voor medewerkers zonder expliciete 'Payroll/Legal Clearance'
    pub fn redact_text(input: &str, redact_salaries: bool) -> String {
        // 1. Maskeer Rijksregisternummers: **.**.**-***.** (geen geboortedatum of identificerende componenten behouden)
        let masked_rrn = RRN_REGEX.replace_all(input, "**.**.**-***.**");

        // 2. Maskeer IBAN rekeningen volledig (geen account- of bankfragmenten behouden)
        let masked_iban = IBAN_REGEX.replace_all(&masked_rrn, "[VERTROUWELIJK_IBAN]");

        // 3. Maskeer salarisbedragen inclusief alle voor- en achtervoegsels indien vereist
        if redact_salaries {
            SALARY_REGEX
                .replace_all(&masked_iban, "€ [VERTROUWELIJK_SALARIS]")
                .to_string()
        } else {
            masked_iban.to_string()
        }
    }

    /// Valideert of een string een syntactisch geldig Belgisch Rijksregisternummer bevat
    pub fn is_valid_belgian_rrn(digits: &str) -> bool {
        let clean: String = digits.chars().filter(|c| c.is_ascii_digit()).collect();
        if clean.len() != 11 {
            return false;
        }

        let base_str = &clean[..9];
        let check_str = &clean[9..];

        let base_num: u64 = match base_str.parse() {
            Ok(n) => n,
            Err(_) => return false,
        };
        let check_num: u64 = match check_str.parse() {
            Ok(n) => n,
            Err(_) => return false,
        };

        if 97 - (base_num % 97) == check_num {
            return true;
        }

        let base_2000 = base_num + 2_000_000_000;
        97 - (base_2000 % 97) == check_num
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rrn_masking() {
        let sample = "Medewerker met RRN 85.04.12-123.45 heeft contract getekend.";
        let redacted = PiiRedactor::redact_text(sample, false);
        assert_eq!(
            redacted,
            "Medewerker met RRN **.**.**-***.** heeft contract getekend."
        );

        let slash_sample = "RRN met slashes 85/04/12/123/45 geregistreerd.";
        let redacted_slash = PiiRedactor::redact_text(slash_sample, false);
        assert_eq!(
            redacted_slash,
            "RRN met slashes **.**.**-***.** geregistreerd."
        );
    }

    #[test]
    fn test_iban_masking_alternate_formats() {
        let samples = vec![
            "Uitbetalen op rekening BE68 5390 0754 7034 aub.",
            "Uitbetalen op rekening BE68.5390.0754.7034 aub.",
            "Uitbetalen op rekening BE68-5390-0754-7034 aub.",
            "Uitbetalen op rekening be68 5390 0754 7034 aub.",
            "Uitbetalen op rekening BE68539007547034 aub.",
            "Uitbetalen op rekening NL91 ABNA 0417 1643 00 aub.",
            "Uitbetalen op rekening DE89 3704 0044 0532 0130 00 aub.",
        ];

        for sample in samples {
            let redacted = PiiRedactor::redact_text(sample, false);
            assert!(
                redacted.contains("[VERTROUWELIJK_IBAN]"),
                "Mislukt voor sample: {}",
                sample
            );
        }
    }

    #[test]
    fn test_salary_masking() {
        let sample = "Het loon bedraagt 3.850 euro bruto per maand met een extra bonus van € 500.";
        let redacted = PiiRedactor::redact_text(sample, true);
        assert!(!redacted.contains("3.850 euro"));
        assert!(!redacted.contains("bruto per maand"));
        assert!(!redacted.contains("€ 500"));
        assert!(redacted.contains("€ [VERTROUWELIJK_SALARIS]"));

        let sample_en = "Current monthly salary is € 3.850,00 gross per month.";
        let redacted_en = PiiRedactor::redact_text(sample_en, true);
        assert!(!redacted_en.contains("gross per month"));
        assert_eq!(
            redacted_en,
            "Current monthly salary is € [VERTROUWELIJK_SALARIS]."
        );
    }
}
