use crate::models::{
    AvailabilityStatus, Customer, DocumentFeedback, DocumentItem, DocumentSourceType, Employee,
    KeyFact, TrustBreakdown,
};
use std::collections::HashMap;

pub fn get_mock_customers() -> Vec<Customer> {
    vec![
        Customer {
            id: "CUST-001".to_string(),
            name: "Acme Logistics BV".to_string(),
            enterprise_number: "BE 0459.832.901".to_string(),
            customer_code: Some("SDW-45983".to_string()),
            industry: "Logistiek & Supply Chain".to_string(),
            joint_committee: "PC 200 - Bedienden".to_string(),
            primary_contact: "Marc Vanhove (HR Director)".to_string(),
            contact_email: "hr@acmelogistics.be".to_string(),
            contact_phone: Some("+32 3 205 11 00".to_string()),
            sdworx_account_manager: Some("Sarah Vermeulen".to_string()),
            employee_count: 142,
            location: "Antwerpen".to_string(),
        },
        Customer {
            id: "CUST-002".to_string(),
            name: "BioHealth Solutions NV".to_string(),
            enterprise_number: "BE 0812.445.671".to_string(),
            customer_code: Some("SDW-81244".to_string()),
            industry: "Farmacie & Biotechnologie".to_string(),
            joint_committee: "PC 207 - Scheikundige Nijverheid".to_string(),
            primary_contact: "Karin De Meyer (Payroll Lead)".to_string(),
            contact_email: "k.demeyer@biohealth.be".to_string(),
            contact_phone: Some("+32 9 321 44 20".to_string()),
            sdworx_account_manager: Some("Emma Wouters".to_string()),
            employee_count: 320,
            location: "Gent".to_string(),
        },
        Customer {
            id: "CUST-003".to_string(),
            name: "Nexus Digital CommV".to_string(),
            enterprise_number: "BE 0799.312.118".to_string(),
            customer_code: Some("SDW-79931".to_string()),
            industry: "IT & Software Development".to_string(),
            joint_committee: "PC 200 - Bedienden".to_string(),
            primary_contact: "Pieter Claes (CEO)".to_string(),
            contact_email: "p.claes@nexusdigital.io".to_string(),
            contact_phone: Some("+32 2 400 89 50".to_string()),
            sdworx_account_manager: Some("Tom De Smet".to_string()),
            employee_count: 28,
            location: "Brussel".to_string(),
        },
        Customer {
            id: "CUST-004".to_string(),
            name: "Vanderstraeten Bouwgroep NV".to_string(),
            enterprise_number: "BE 0418.992.341".to_string(),
            customer_code: Some("SDW-41899".to_string()),
            industry: "Bouw & Constructie".to_string(),
            joint_committee: "PC 124 - Bouwbedrijf".to_string(),
            primary_contact: "Luc Vanderstraeten (Bestuurder)".to_string(),
            contact_email: "personeel@vanderstraeten.be".to_string(),
            contact_phone: Some("+32 11 28 30 00".to_string()),
            sdworx_account_manager: Some("Tom De Smet".to_string()),
            employee_count: 85,
            location: "Hasselt".to_string(),
        },
        Customer {
            id: "CUST-005".to_string(),
            name: "Grand Palace Hotel & Catering BV".to_string(),
            enterprise_number: "BE 0652.188.904".to_string(),
            customer_code: Some("SDW-65218".to_string()),
            industry: "Horeca & Toerisme".to_string(),
            joint_committee: "PC 302 - Horecabedrijf".to_string(),
            primary_contact: "Annelies Maes (HR Coördinator)".to_string(),
            contact_email: "hr@grandpalace.be".to_string(),
            contact_phone: Some("+32 50 44 12 30".to_string()),
            sdworx_account_manager: Some("Kevin Peeters".to_string()),
            employee_count: 54,
            location: "Brugge".to_string(),
        },
    ]
}

pub fn get_mock_documents() -> Vec<DocumentItem> {
    vec![
        // DOC 1: Getekend Addendum (GOUDEN STANDAARD - 38u/week)
        DocumentItem {
            id: "DOC-001".to_string(),
            customer_id: "CUST-001".to_string(),
            title: "Getekend Addendum Arbeidsovereenkomst & Thuiswerkbeleid 2024".to_string(),
            source_type: DocumentSourceType::SignedContract,
            source_label: DocumentSourceType::SignedContract.label().to_string(),
            date: "2024-05-12".to_string(),
            author: "Marc Vanhove & Directie".to_string(),
            author_role: "Klant HR Directie & SD Worx Legal".to_string(),
            summary: "Officieel medeondertekend addendum betreffende het voltijds arbeidsregime van 38 uur per week, telewerkmodaliteiten (max. 2 dagen) en representatievergoeding.".to_string(),
            raw_content: "Overeenkomst gesloten tussen Acme Logistics BV en werknemersvertegenwoordiging. Artikel 3: Het wekelijks werkregime voor alle bedienden onder PC 200 is vastgesteld op exact 38u/week verdeeld over 5 werkdagen. Telewerk is toegestaan voor maximaal 2 dagen per week mits goedkeuring leidinggevende. Referentie medewerker dossier RRN 85.04.12-123.45, bankrekening BE68 5390 0754 7034. Bruto basiswedde directieassistentie € 3.850,00 bruto per maand.".to_string(),
            key_facts: vec![
                KeyFact {
                    field: "werkregime".to_string(),
                    label: "Wekelijks Werkregime".to_string(),
                    value: "38u/week".to_string(),
                    is_conflicting: false,
                },
                KeyFact {
                    field: "thuiswerk".to_string(),
                    label: "Structureel Thuiswerk".to_string(),
                    value: "2 dagen/week".to_string(),
                    is_conflicting: false,
                },
                KeyFact {
                    field: "paritair_comite".to_string(),
                    label: "Paritair Comité".to_string(),
                    value: "PC 200".to_string(),
                    is_conflicting: false,
                },
            ],
            tags: vec!["Contract".to_string(), "Arbeidsduur".to_string(), "PC 200".to_string(), "Thuiswerk".to_string()],
            trust: TrustBreakdown {
                overall_score: 95.0,
                source_score: 100.0,
                recency_score: 88.0,
                consensus_score: 92.0,
                feedback_score: 100.0,
                is_authoritative: true,
                conflict_flag: false,
            },
            feedback: DocumentFeedback {
                verified_count: 7,
                outdated_count: 0,
                questionable_count: 0,
            },
        },

        // DOC 2: SD Worx Sectorale Barematemplate
        DocumentItem {
            id: "DOC-002".to_string(),
            customer_id: "CUST-001".to_string(),
            title: "SD Worx Barema & Arbeidsduur Template PC 200 (Editie 2024)".to_string(),
            source_type: DocumentSourceType::OfficialTemplate,
            source_label: DocumentSourceType::OfficialTemplate.label().to_string(),
            date: "2024-01-15".to_string(),
            author: "SD Worx Kenniscentrum Sociaal Recht".to_string(),
            author_role: "SD Worx Legal Knowledge Center".to_string(),
            summary: "Officiële sectorale richtlijn SD Worx voor bedienden onder PC 200. Bevestigt de wettelijke 38-urenweek en de indexeringsregels.".to_string(),
            raw_content: "SD Worx Kennisdossier PC 200. De standaard arbeidsduur bedraagt 38u/week, tenzij op ondernemingsvlak een kortere arbeidsduur werd ingevoerd met ADV-dagen. Maaltijdcheque werkgeversbijdrage maximaal € 6,91 (totaal € 8,00 per gewerkte dag).".to_string(),
            key_facts: vec![
                KeyFact {
                    field: "werkregime".to_string(),
                    label: "Wekelijks Werkregime".to_string(),
                    value: "38u/week".to_string(),
                    is_conflicting: false,
                },
                KeyFact {
                    field: "maaltijdcheque".to_string(),
                    label: "Maaltijdcheque Nominaal".to_string(),
                    value: "€ 8,00/dag".to_string(),
                    is_conflicting: false,
                },
            ],
            tags: vec!["SD Worx Template".to_string(), "Barema".to_string(), "PC 200".to_string()],
            trust: TrustBreakdown {
                overall_score: 91.0,
                source_score: 90.0,
                recency_score: 86.0,
                consensus_score: 92.0,
                feedback_score: 95.0,
                is_authoritative: true,
                conflict_flag: false,
            },
            feedback: DocumentFeedback {
                verified_count: 5,
                outdated_count: 0,
                questionable_count: 0,
            },
        },

        // DOC 3: CRM Notitie
        DocumentItem {
            id: "DOC-003".to_string(),
            customer_id: "CUST-001".to_string(),
            title: "CRM Notitie - Kwartaaloverleg HR & Expat Afspraken".to_string(),
            source_type: DocumentSourceType::CrmNote,
            source_label: DocumentSourceType::CrmNote.label().to_string(),
            date: "2025-03-10".to_string(),
            author: "Sarah Vermeulen".to_string(),
            author_role: "Senior Payroll Officer SD Worx".to_string(),
            summary: "Verslag van kwartaaloverleg met Marc Vanhove. Behandeling van 3 internationale detacheringen naar Nederland en bevestiging van de 38u-regeling.".to_string(),
            raw_content: "Overleg met Marc Vanhove inzake grensoverschrijdend telewerk. Grenswerkers vallen onder A1-verordening met max 49.9% telewerk in woonland. Normale werktijd blijft 38u/week conform Addendum 2024. Contactpersoon Marc goedgekeurd.".to_string(),
            key_facts: vec![
                KeyFact {
                    field: "werkregime".to_string(),
                    label: "Wekelijks Werkregime".to_string(),
                    value: "38u/week".to_string(),
                    is_conflicting: false,
                },
                KeyFact {
                    field: "thuiswerk".to_string(),
                    label: "Structureel Thuiswerk".to_string(),
                    value: "2 dagen/week".to_string(),
                    is_conflicting: false,
                },
            ],
            tags: vec!["CRM".to_string(), "Expat".to_string(), "Internationaal".to_string(), "Overleg".to_string()],
            trust: TrustBreakdown {
                overall_score: 78.0,
                source_score: 75.0,
                recency_score: 82.0,
                consensus_score: 85.0,
                feedback_score: 80.0,
                is_authoritative: false,
                conflict_flag: false,
            },
            feedback: DocumentFeedback {
                verified_count: 3,
                outdated_count: 0,
                questionable_count: 0,
            },
        },

        // DOC 4: DE OUTLIER (Het Ticket met foute info 36u)
        DocumentItem {
            id: "DOC-004".to_string(),
            customer_id: "CUST-001".to_string(),
            title: "ServiceDesk Ticket #421 - Vraag inzake Arbeidsduur & Feestdagen".to_string(),
            source_type: DocumentSourceType::TicketComment,
            source_label: DocumentSourceType::TicketComment.label().to_string(),
            date: "2025-09-04".to_string(),
            author: "Kevin Peeters".to_string(),
            author_role: "Junior HR Consultant SD Worx".to_string(),
            summary: "Ticketantwoord waarin Kevin per abuis vermeldt dat Acme Logistics op een 36u-regime werkt n.a.v. een vraag over compensatierust.".to_string(),
            raw_content: "Beste Marc, voor de berekening van de feestdagvergoeding zijn we uitgegaan van de 36u/week regeling die van toepassing is op de logistieke site. Gelieve dit te bevestigen voor de loonstrook van september.".to_string(),
            key_facts: vec![
                KeyFact {
                    field: "werkregime".to_string(),
                    label: "Wekelijks Werkregime".to_string(),
                    value: "36u/week".to_string(), // HIER ZIT HET CONFLICT!
                    is_conflicting: true,
                },
            ],
            tags: vec!["Ticket".to_string(), "Feestdagen".to_string(), "Arbeidsduur".to_string()],
            trust: TrustBreakdown {
                overall_score: 48.0,
                source_score: 50.0,
                recency_score: 72.0,
                consensus_score: 35.0,
                feedback_score: 50.0,
                is_authoritative: false,
                conflict_flag: true,
            },
            feedback: DocumentFeedback {
                verified_count: 0,
                outdated_count: 4,
                questionable_count: 3,
            },
        },

        // DOC 5: Teams Chat Notitie
        DocumentItem {
            id: "DOC-005".to_string(),
            customer_id: "CUST-001".to_string(),
            title: "Teams Notitie - Vaste Brugdagen & Collectieve Sluiting".to_string(),
            source_type: DocumentSourceType::ChatMessage,
            source_label: DocumentSourceType::ChatMessage.label().to_string(),
            date: "2026-01-14".to_string(),
            author: "Tom De Smet".to_string(),
            author_role: "Payroll Consultant SD Worx".to_string(),
            summary: "Korte chatnotitie met Marc over collectieve sluitingsdagen tussen Kerst en Nieuwjaar.".to_string(),
            raw_content: "Marc bevestigt via chat: bedrijf sluit op 24/12 en 31/12 in de namiddag. Brugdag op Hemelvaartsdag goedgekeurd door ondernemingsraad.".to_string(),
            key_facts: vec![
                KeyFact {
                    field: "brugdagen".to_string(),
                    label: "Vaste Brugdagen".to_string(),
                    value: "Hemelvaart + Kerstavond NM".to_string(),
                    is_conflicting: false,
                },
            ],
            tags: vec!["Teams".to_string(), "Sluiting".to_string(), "Verlof".to_string()],
            trust: TrustBreakdown {
                overall_score: 38.0,
                source_score: 35.0,
                recency_score: 90.0,
                consensus_score: 70.0,
                feedback_score: 60.0,
                is_authoritative: false,
                conflict_flag: false,
            },
            feedback: DocumentFeedback {
                verified_count: 1,
                outdated_count: 0,
                questionable_count: 1,
            },
        },
    ]
}

pub fn get_mock_employees() -> Vec<Employee> {
    let mut sarah_cust = HashMap::new();
    sarah_cust.insert("CUST-001".to_string(), 95.0); // Kent Acme Logistics door en door
    sarah_cust.insert("CUST-002".to_string(), 40.0);
    sarah_cust.insert("CUST-003".to_string(), 25.0);

    let mut sarah_dom = HashMap::new();
    sarah_dom.insert("Internationale Detachering & Expat".to_string(), 96.0);
    sarah_dom.insert("CAO 200 & Bediendenstatuut".to_string(), 94.0);
    sarah_dom.insert("Werkregime & Arbeidstijd".to_string(), 92.0);
    sarah_dom.insert("Tijdsregistratie & Overuren".to_string(), 70.0);
    sarah_dom.insert("Cafetariaplan & Flex Income".to_string(), 85.0);

    let mut emma_cust = HashMap::new();
    emma_cust.insert("CUST-001".to_string(), 72.0);
    emma_cust.insert("CUST-002".to_string(), 88.0);
    emma_cust.insert("CUST-003".to_string(), 50.0);

    let mut emma_dom = HashMap::new();
    emma_dom.insert("Internationale Detachering & Expat".to_string(), 98.0);
    emma_dom.insert("CAO 200 & Bediendenstatuut".to_string(), 95.0);
    emma_dom.insert("Werkregime & Arbeidstijd".to_string(), 89.0);
    emma_dom.insert("Tijdsregistratie & Overuren".to_string(), 65.0);
    emma_dom.insert("Cafetariaplan & Flex Income".to_string(), 92.0);

    let mut tom_cust = HashMap::new();
    tom_cust.insert("CUST-001".to_string(), 60.0);
    tom_cust.insert("CUST-002".to_string(), 30.0);
    tom_cust.insert("CUST-003".to_string(), 85.0);

    let mut tom_dom = HashMap::new();
    tom_dom.insert("Tijdsregistratie & Overuren".to_string(), 96.0);
    tom_dom.insert("Werkregime & Arbeidstijd".to_string(), 88.0);
    tom_dom.insert("CAO 200 & Bediendenstatuut".to_string(), 78.0);
    tom_dom.insert("Internationale Detachering & Expat".to_string(), 45.0);
    tom_dom.insert("Cafetariaplan & Flex Income".to_string(), 60.0);

    let mut kevin_cust = HashMap::new();
    kevin_cust.insert("CUST-001".to_string(), 35.0);
    kevin_cust.insert("CUST-002".to_string(), 15.0);
    kevin_cust.insert("CUST-003".to_string(), 20.0);

    let mut kevin_dom = HashMap::new();
    kevin_dom.insert("Werkregime & Arbeidstijd".to_string(), 60.0);
    kevin_dom.insert("CAO 200 & Bediendenstatuut".to_string(), 55.0);
    kevin_dom.insert("Tijdsregistratie & Overuren".to_string(), 65.0);
    kevin_dom.insert("Internationale Detachering & Expat".to_string(), 25.0);
    kevin_dom.insert("Cafetariaplan & Flex Income".to_string(), 40.0);

    vec![
        Employee {
            id: "EMP-001".to_string(),
            name: "Sarah Vermeulen".to_string(),
            title: "Senior Payroll Officer & Expat Lead".to_string(),
            department: "SME & Enterprise Large Accounts".to_string(),
            avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80".to_string(),
            availability: AvailabilityStatus::Available,
            completed_cases: 48,
            customer_familiarity: sarah_cust,
            domain_expertise: sarah_dom,
            recent_activity: "Loonindexering januari en telewerkaanpassing afgerond voor Acme Logistics.".to_string(),
        },
        Employee {
            id: "EMP-002".to_string(),
            name: "Emma Wouters".to_string(),
            title: "Legal Advisor Sociaal Recht".to_string(),
            department: "SD Worx Legal Knowledge Center".to_string(),
            avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80".to_string(),
            availability: AvailabilityStatus::Available,
            completed_cases: 39,
            customer_familiarity: emma_cust,
            domain_expertise: emma_dom,
            recent_activity: "A1-aanvragen en grensarbeid dossiers goedgekeurd.".to_string(),
        },
        Employee {
            id: "EMP-003".to_string(),
            name: "Tom De Smet".to_string(),
            title: "Consultant Tijdsregistratie & Planning".to_string(),
            department: "Workforce Management Solutions".to_string(),
            avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80".to_string(),
            availability: AvailabilityStatus::InCall,
            completed_cases: 31,
            customer_familiarity: tom_cust,
            domain_expertise: tom_dom,
            recent_activity: "In gesprek met Nexus Digital over overurenregistratie.".to_string(),
        },
        Employee {
            id: "EMP-004".to_string(),
            name: "Kevin Peeters".to_string(),
            title: "Junior Payroll & Customer Support".to_string(),
            department: "ServiceDesk Frontline".to_string(),
            avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80".to_string(),
            availability: AvailabilityStatus::Available,
            completed_cases: 14,
            customer_familiarity: kevin_cust,
            domain_expertise: kevin_dom,
            recent_activity: "Eerste lijns ticket triage afgerond.".to_string(),
        },
    ]
}
