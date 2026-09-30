use regex::Regex;
use std::sync::LazyLock;

// Regex voor Belgisch Rijksregisternummer (RRN): bv. 85.04.12-123.45 of 85041212345
static RRN_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"\b(\d{2})[\.\s]?(\d{2})[\.\s]?(\d{2})[-–\s]?(\d{3})[\.\s]?(\d{2})\b").unwrap()
});

// Regex voor Belgische IBAN bankrekening: BE## #### #### ####
static IBAN_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"\b(BE\d{2})[\s]?(\d{4})[\s]?(\d{4})[\s]?(\d{4})\b").unwrap()
});

// Regex voor Bruto Salarisbedragen
static SALARY_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(€\s?|\bEUR\s?)(\d{1,3}(?:\.\d{3})*|\d+)(?:,\d{2})?\s?(?:bruto|maandloon|uurloon|/maand|/uur)?").unwrap()
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
            SALARY_REGEX.replace_all(&masked_iban, "€ [VERTROUWELIJK_SALARIS]")
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

        // Parse base en checksum
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

        // Algoritme voor geboren voor 2000: 97 - (base % 97) == checksum
        if 97 - (base_num % 97) == check_num {
            return true;
        }

        // Algoritme voor geboren na 2000 (prefix 2 toevoegen):
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
        assert_eq!(redacted, "Medewerker met RRN 85.04.12-***.** heeft contract getekend.");
    }

    #[test]
    fn test_iban_masking() {
        let sample = "Uitbetalen op rekening BE68 5390 0754 7034 aub.";
        let redacted = PiiRedactor::redact_text(sample, false);
        assert_eq!(redacted, "Uitbetalen op rekening BE68 **** **** 7034 aub.");
    }
}
