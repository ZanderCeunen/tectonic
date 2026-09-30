use regex::Regex;
use std::sync::LazyLock;

// Regex voor Belgisch Rijksregisternummer (RRN): bv. 85.04.12-123.45 of 85041212345
static RRN_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"\b(\d{2})[\.\s]?(\d{2})[\.\s]?(\d{2})[-–\s]?(\d{3})[\.\s]?(\d{2})\b").unwrap()
});

// Regex voor IBAN bankrekening (inclusief punten, streepjes, spaties, kleine letters en internationale prefixes):
// e.g. BE68 5390 0754 7034, BE68.5390.0754.7034, BE68-5390-0754-7034, be68 5390 0754 7034, NL91 ABNA 0417 1643 00
static IBAN_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)\b([A-Z]{2}\d{2})[.\-\s]?(\d{4})[.\-\s]?(\d{4})[.\-\s]?(\d{4})\b").unwrap()
});

// Regex voor Salarisbedragen (vergoedingen, weddes, bruto maand/uurloon, euro notaties):
static SALARY_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)(?:€|EUR|euro)\s?\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\b\d{1,3}(?:\.\d{3})*(?:,\d{2})?\s?(?:euro|EUR|bruto|maandloon|uurloon|/maand|/uur|brutoloon)\b|\b(?:bruto|wedde|salaris|loon)\s?:?\s?(?:€|EUR)?\s?\d{1,3}(?:\.\d{3})*(?:,\d{2})?").unwrap()
});

pub struct PiiRedactor;

impl PiiRedactor {
    /// Maskeert gevoelige data voor medewerkers zonder expliciete 'Payroll/Legal Clearance'
    pub fn redact_text(input: &str, redact_salaries: bool) -> String {
        // 1. Maskeer Rijksregisternummers: 85.04.12-***.**
        let masked_rrn = RRN_REGEX.replace_all(input, "$1.$2.$3-***.**");

        // 2. Maskeer IBAN rekeningen: BE12 **** **** 5678
        let masked_iban = IBAN_REGEX.replace_all(&masked_rrn, "$1 **** **** $4");

        // 3. Maskeer salarisbedragen indien vereist
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
            "Medewerker met RRN 85.04.12-***.** heeft contract getekend."
        );
    }

    #[test]
    fn test_iban_masking_alternate_formats() {
        let samples = vec![
            "Uitbetalen op rekening BE68 5390 0754 7034 aub.",
            "Uitbetalen op rekening BE68.5390.0754.7034 aub.",
            "Uitbetalen op rekening BE68-5390-0754-7034 aub.",
            "Uitbetalen op rekening be68 5390 0754 7034 aub.",
        ];

        for sample in samples {
            let redacted = PiiRedactor::redact_text(sample, false);
            assert!(
                redacted.contains("BE68 **** **** 7034")
                    || redacted.contains("be68 **** **** 7034"),
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
        assert!(!redacted.contains("€ 500"));
        assert!(redacted.contains("€ [VERTROUWELIJK_SALARIS]"));
    }
}
