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
            industry: "Logistiek, Opslag & Distributie".to_string(),
            joint_committee: "PC 200 - Aanvullend Paritair Comité voor Bedienden".to_string(),
            joint_committee_code: Some("200.00".to_string()),
            primary_contact: "Marc Vanhove (HR Director)".to_string(),
            contact_email: "hr@acmelogistics.be".to_string(),
            contact_phone: Some("+32 3 205 11 00".to_string()),
            sdworx_account_manager: Some("Sarah Vermeulen".to_string()),
            sdworx_team: Some("Antwerpen Enterprise - Team 4".to_string()),
            employee_count: 142,
            location: "Antwerpen (Haven)".to_string(),
            payroll_frequency: Some("Maandelijks (25e)".to_string()),
            active_dossier_status: Some("Actief • Verwerking Q1".to_string()),
        },
        Customer {
            id: "CUST-002".to_string(),
            name: "BioHealth Solutions NV".to_string(),
            enterprise_number: "BE 0812.445.671".to_string(),
            customer_code: Some("SDW-81244".to_string()),
            industry: "Farmacie & Biotechnologie".to_string(),
            joint_committee: "PC 207 - Scheikundige Nijverheid".to_string(),
            joint_committee_code: Some("207.00".to_string()),
            primary_contact: "Karin De Meyer (Payroll Lead)".to_string(),
            contact_email: "k.demeyer@biohealth.be".to_string(),
            contact_phone: Some("+32 9 321 44 20".to_string()),
            sdworx_account_manager: Some("Emma Wouters".to_string()),
            sdworx_team: Some("Gent Corporate & Science".to_string()),
            employee_count: 320,
            location: "Gent (Zwijnaarde)".to_string(),
            payroll_frequency: Some("Maandelijks (28e)".to_string()),
            active_dossier_status: Some("Actief • Volcontinue ploegen".to_string()),
        },
        Customer {
            id: "CUST-003".to_string(),
            name: "Nexus Digital CommV".to_string(),
            enterprise_number: "BE 0799.312.118".to_string(),
            customer_code: Some("SDW-79931".to_string()),
            industry: "Software Engineering & Cloud".to_string(),
            joint_committee: "PC 200 - Bedienden".to_string(),
            joint_committee_code: Some("200.00".to_string()),
            primary_contact: "Pieter Claes (CEO)".to_string(),
            contact_email: "p.claes@nexusdigital.io".to_string(),
            contact_phone: Some("+32 2 400 89 50".to_string()),
            sdworx_account_manager: Some("Tom De Smet".to_string()),
            sdworx_team: Some("Brussel SME Tech".to_string()),
            employee_count: 28,
            location: "Brussel (Centrum)".to_string(),
            payroll_frequency: Some("Maandelijks (27e)".to_string()),
            active_dossier_status: Some("Actief • Cafetariaplan 2026".to_string()),
        },
        Customer {
            id: "CUST-004".to_string(),
            name: "Vanderstraeten Bouwgroep NV".to_string(),
            enterprise_number: "BE 0418.992.341".to_string(),
            customer_code: Some("SDW-41899".to_string()),
            industry: "Algemene Bouw & Infrastructuur".to_string(),
            joint_committee: "PC 124 - Bouwbedrijf".to_string(),
            joint_committee_code: Some("124.00".to_string()),
            primary_contact: "Luc Vanderstraeten (Bestuurder)".to_string(),
            contact_email: "personeel@vanderstraeten.be".to_string(),
            contact_phone: Some("+32 11 28 30 00".to_string()),
            sdworx_account_manager: Some("Tom De Smet".to_string()),
            sdworx_team: Some("Hasselt Construction Hub".to_string()),
            employee_count: 85,
            location: "Hasselt".to_string(),
            payroll_frequency: Some("Maandelijks (arbeiders + bedienden)".to_string()),
            active_dossier_status: Some("Actief • Weerverlet & Rustdagen".to_string()),
        },
        Customer {
            id: "CUST-005".to_string(),
            name: "Grand Palace Hotel & Catering BV".to_string(),
            enterprise_number: "BE 0652.188.904".to_string(),
            customer_code: Some("SDW-65218".to_string()),
            industry: "Horeca, Hospitality & Evenementen".to_string(),
            joint_committee: "PC 302 - Horecabedrijf".to_string(),
            joint_committee_code: Some("302.00".to_string()),
            primary_contact: "Annelies Maes (HR Coördinator)".to_string(),
            contact_email: "hr@grandpalace.be".to_string(),
            contact_phone: Some("+32 50 44 12 30".to_string()),
            sdworx_account_manager: Some("Kevin Peeters".to_string()),
            sdworx_team: Some("Kust & Hospitality Desk".to_string()),
            employee_count: 54,
            location: "Brugge".to_string(),
            payroll_frequency: Some("Maandelijks + Flexi-jobs".to_string()),
            active_dossier_status: Some("Actief • Seizoenscontracten".to_string()),
        },
        Customer {
            id: "CUST-006".to_string(),
            name: "Flanders Food Processing NV".to_string(),
            enterprise_number: "BE 0433.819.205".to_string(),
            customer_code: Some("SDW-43381".to_string()),
            industry: "Industriële Voedselproductie".to_string(),
            joint_committee: "PC 118 - Voedingsnijverheid".to_string(),
            joint_committee_code: Some("118.00".to_string()),
            primary_contact: "Dirk Vansteenkiste (Plant HR)".to_string(),
            contact_email: "d.vansteenkiste@flandersfood.be".to_string(),
            contact_phone: Some("+32 51 22 88 00".to_string()),
            sdworx_account_manager: Some("Sarah Vermeulen".to_string()),
            sdworx_team: Some("West-Vlaanderen Industry".to_string()),
            employee_count: 210,
            location: "Roeselare".to_string(),
            payroll_frequency: Some("Tweewekelijks / Maandelijks".to_string()),
            active_dossier_status: Some("Actief • Nacht- en ploegenpremies".to_string()),
        },
        Customer {
            id: "CUST-007".to_string(),
            name: "Metaalconstructies De Smet & Zonen BV".to_string(),
            enterprise_number: "BE 0429.112.873".to_string(),
            customer_code: Some("SDW-42911".to_string()),
            industry: "Metaalverwerking & Precisiebouw".to_string(),
            joint_committee: "PC 111 - Metaalbewerkers".to_string(),
            joint_committee_code: Some("111.01".to_string()),
            primary_contact: "Bart De Smet (Afgevaardigd Bestuurder)".to_string(),
            contact_email: "administratie@desmetmetaal.be".to_string(),
            contact_phone: Some("+32 15 34 10 90".to_string()),
            sdworx_account_manager: Some("Emma Wouters".to_string()),
            sdworx_team: Some("Mechelen Manufacturing".to_string()),
            employee_count: 62,
            location: "Mechelen".to_string(),
            payroll_frequency: Some("Maandelijks".to_string()),
            active_dossier_status: Some("Actief • Barema-indexering 2026".to_string()),
        },
        Customer {
            id: "CUST-008".to_string(),
            name: "Zorgcampus Sint-Elisabeth VZW".to_string(),
            enterprise_number: "BE 0214.991.034".to_string(),
            customer_code: Some("SDW-21499".to_string()),
            industry: "Gezondheidszorg & Woonzorgcentra".to_string(),
            joint_committee: "PC 330 - Gezondheidsinrichtingen".to_string(),
            joint_committee_code: Some("330.01".to_string()),
            primary_contact: "Hilde Goossens (Directeur Personeel)".to_string(),
            contact_email: "personeelsdienst@sintelizabeth.be".to_string(),
            contact_phone: Some("+32 16 38 90 00".to_string()),
            sdworx_account_manager: Some("Sarah Vermeulen".to_string()),
            sdworx_team: Some("Non-Profit & Healthcare Desk".to_string()),
            employee_count: 450,
            location: "Leuven".to_string(),
            payroll_frequency: Some("Maandelijks (IFIC Barema's)".to_string()),
            active_dossier_status: Some("Actief • IFIC Functieclassificatie".to_string()),
        },
    ]
}

pub fn get_mock_documents() -> Vec<DocumentItem> {
    vec![
        // CUST-001: Acme Logistics BV
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
            raw_content: "Overeenkomst gesloten tussen Acme Logistics BV en werknemersvertegenwoordiging. Artikel 3: Het wekelijks werkregime voor alle bedienden onder PC 200 is vastgesteld op exact 38u/week verdeeld over 5 werkdagen. Telewerk is toegestaan voor maximaal 2 dagen per week mits goedkeuring leidinggevende. Referentie medewerker dossier RRN 85.04.12-***.**, bankrekening BE68 **** **** 7034. Bruto basiswedde directieassistentie € [VERTROUWELIJK_SALARIS].".to_string(),
            unmasked_raw_content: Some("Overeenkomst gesloten tussen Acme Logistics BV en werknemersvertegenwoordiging. Artikel 3: Het wekelijks werkregime voor alle bedienden onder PC 200 is vastgesteld op exact 38u/week verdeeld over 5 werkdagen. Telewerk is toegestaan voor maximaal 2 dagen per week mits goedkeuring leidinggevende. Referentie medewerker dossier RRN 85.04.12-123.45, bankrekening BE68 5390 0754 7034. Bruto basiswedde directieassistentie € 3.850,00 bruto per maand.".to_string()),
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
        DocumentItem {
            id: "DOC-002".to_string(),
            customer_id: "CUST-001".to_string(),
            title: "SD Worx Sectorale Barema & Arbeidsduur Richtlijn PC 200".to_string(),
            source_type: DocumentSourceType::OfficialTemplate,
            source_label: DocumentSourceType::OfficialTemplate.label().to_string(),
            date: "2024-01-15".to_string(),
            author: "SD Worx Kenniscentrum Sociaal Recht".to_string(),
            author_role: "SD Worx Legal Knowledge Center".to_string(),
            summary: "Officiële sectorale richtlijn SD Worx voor bedienden onder PC 200. Bevestigt de wettelijke 38-urenweek en indexeringsregels.".to_string(),
            raw_content: "SD Worx Kennisdossier PC 200. De standaard arbeidsduur bedraagt 38u/week, tenzij op ondernemingsvlak een kortere arbeidsduur werd ingevoerd met ADV-dagen. Maaltijdcheque werkgeversbijdrage maximaal € 6,91 (totaal € 8,00 per gewerkte dag).".to_string(),
            unmasked_raw_content: Some("SD Worx Kennisdossier PC 200. De standaard arbeidsduur bedraagt 38u/week, tenzij op ondernemingsvlak een kortere arbeidsduur werd ingevoerd met ADV-dagen. Maaltijdcheque werkgeversbijdrage maximaal € 6,91 (totaal € 8,00 per gewerkte dag).".to_string()),
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
        DocumentItem {
            id: "DOC-003".to_string(),
            customer_id: "CUST-001".to_string(),
            title: "CRM Notitie - Kwartaaloverleg HR & Expat Detacheringen".to_string(),
            source_type: DocumentSourceType::CrmNote,
            source_label: DocumentSourceType::CrmNote.label().to_string(),
            date: "2025-03-10".to_string(),
            author: "Sarah Vermeulen".to_string(),
            author_role: "Senior Payroll Officer SD Worx".to_string(),
            summary: "Verslag van kwartaaloverleg met Marc Vanhove. Behandeling van 3 internationale detacheringen naar Nederland en bevestiging van de 38u-regeling.".to_string(),
            raw_content: "Overleg met Marc Vanhove inzake grensoverschrijdend telewerk. Grenswerkers vallen onder A1-verordening met max 49.9% telewerk in woonland. Normale werktijd blijft 38u/week conform Addendum 2024. Contactpersoon Marc goedgekeurd.".to_string(),
            unmasked_raw_content: Some("Overleg met Marc Vanhove inzake grensoverschrijdend telewerk. Grenswerkers vallen onder A1-verordening met max 49.9% telewerk in woonland. Normale werktijd blijft 38u/week conform Addendum 2024. Contactpersoon Marc goedgekeurd.".to_string()),
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
        DocumentItem {
            id: "DOC-004".to_string(),
            customer_id: "CUST-001".to_string(),
            title: "ServiceDesk Ticket #421 - Vraag inzake Feestdagcompensatie & Werkduur".to_string(),
            source_type: DocumentSourceType::TicketComment,
            source_label: DocumentSourceType::TicketComment.label().to_string(),
            date: "2025-09-04".to_string(),
            author: "Kevin Peeters".to_string(),
            author_role: "Junior Payroll Consultant SD Worx".to_string(),
            summary: "Ticketantwoord waarin Kevin per abuis vermeldt dat Acme Logistics op een 36u-regime werkt n.a.v. een vraag over compensatierust voor feestdagen.".to_string(),
            raw_content: "Beste Marc, voor de berekening van de feestdagvergoeding zijn we uitgegaan van de 36u/week regeling die van toepassing is op de logistieke site. Gelieve dit te bevestigen voor de loonstrook van september.".to_string(),
            unmasked_raw_content: Some("Beste Marc, voor de berekening van de feestdagvergoeding zijn we uitgegaan van de 36u/week regeling die van toepassing is op de logistieke site. Gelieve dit te bevestigen voor de loonstrook van september.".to_string()),
            key_facts: vec![
                KeyFact {
                    field: "werkregime".to_string(),
                    label: "Wekelijks Werkregime".to_string(),
                    value: "36u/week".to_string(),
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
        DocumentItem {
            id: "DOC-005".to_string(),
            customer_id: "CUST-001".to_string(),
            title: "Teams Notitie - Vaste Brugdagen & Collectieve Sluiting 2026".to_string(),
            source_type: DocumentSourceType::ChatMessage,
            source_label: DocumentSourceType::ChatMessage.label().to_string(),
            date: "2026-01-14".to_string(),
            author: "Tom De Smet".to_string(),
            author_role: "Payroll Consultant SD Worx".to_string(),
            summary: "Korte chatnotitie met Marc over collectieve sluitingsdagen tussen Kerst en Nieuwjaar.".to_string(),
            raw_content: "Marc bevestigt via chat: bedrijf sluit op 24/12 en 31/12 in de namiddag. Brugdag op Hemelvaartsdag goedgekeurd door ondernemingsraad.".to_string(),
            unmasked_raw_content: Some("Marc bevestigt via chat: bedrijf sluit op 24/12 en 31/12 in de namiddag. Brugdag op Hemelvaartsdag goedgekeurd door ondernemingsraad.".to_string()),
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

        // CUST-002: BioHealth Solutions NV
        DocumentItem {
            id: "DOC-006".to_string(),
            customer_id: "CUST-002".to_string(),
            title: "Bedrijfs-CAO Volcontinu Ploegenarbeid PC 207 (Geregistreerd 2024)".to_string(),
            source_type: DocumentSourceType::SignedContract,
            source_label: DocumentSourceType::SignedContract.label().to_string(),
            date: "2024-03-20".to_string(),
            author: "Karin De Meyer & SD Worx Legal".to_string(),
            author_role: "Ondernemingsraad & SD Worx Jurist".to_string(),
            summary: "Neergelegde collectieve arbeidsovereenkomst voor 5-ploegenstelsel in chemische productie. Ploegenpremie vastgesteld op 27.5% voor volcontinu.".to_string(),
            raw_content: "Bedrijfs-CAO BioHealth Solutions NV. Werkduur gemiddeld 33.6u/week in volcontinu cyclus met 12 compensatiedagen per kalenderjaar. Ploegentoeslag ochtend/middag 12.5%, nacht 27.5%. Paritair Comité 207.".to_string(),
            unmasked_raw_content: Some("Bedrijfs-CAO BioHealth Solutions NV. Werkduur gemiddeld 33.6u/week in volcontinu cyclus met 12 compensatiedagen per kalenderjaar. Ploegentoeslag ochtend/middag 12.5%, nacht 27.5%. Paritair Comité 207.".to_string()),
            key_facts: vec![
                KeyFact {
                    field: "ploegenregime".to_string(),
                    label: "Ploegenregime".to_string(),
                    value: "33.6u/week (5-ploegen)".to_string(),
                    is_conflicting: false,
                },
                KeyFact {
                    field: "nachtpremie".to_string(),
                    label: "Nachttoeslag".to_string(),
                    value: "27.5%".to_string(),
                    is_conflicting: false,
                },
                KeyFact {
                    field: "paritair_comite".to_string(),
                    label: "Paritair Comité".to_string(),
                    value: "PC 207".to_string(),
                    is_conflicting: false,
                },
            ],
            tags: vec!["CAO".to_string(), "Ploegenarbeid".to_string(), "PC 207".to_string(), "Toeslagen".to_string()],
            trust: TrustBreakdown {
                overall_score: 96.0,
                source_score: 100.0,
                recency_score: 90.0,
                consensus_score: 95.0,
                feedback_score: 100.0,
                is_authoritative: true,
                conflict_flag: false,
            },
            feedback: DocumentFeedback {
                verified_count: 9,
                outdated_count: 0,
                questionable_count: 0,
            },
        },
        DocumentItem {
            id: "DOC-007".to_string(),
            customer_id: "CUST-002".to_string(),
            title: "Afsprakennota Wachtdiensten & Oproepbaarheid R&D Laboranten".to_string(),
            source_type: DocumentSourceType::OfficialTemplate,
            source_label: DocumentSourceType::OfficialTemplate.label().to_string(),
            date: "2025-01-10".to_string(),
            author: "Emma Wouters".to_string(),
            author_role: "Legal Advisor SD Worx".to_string(),
            summary: "Fiscale en sociale behandeling van standby-vergoedingen voor laboranten buiten de reguliere diensturen.".to_string(),
            raw_content: "Vergoeding voor beschikbaarheid thuis: € 2.45 bruto per uur standby. Bij fysieke oproep minimaal 3 uur uitbetaald aan 150% met verplichte rusttijd van 11 opeenvolgende uren conform arbeidswet.".to_string(),
            unmasked_raw_content: Some("Vergoeding voor beschikbaarheid thuis: € 2.45 bruto per uur standby. Bij fysieke oproep minimaal 3 uur uitbetaald aan 150% met verplichte rusttijd van 11 opeenvolgende uren conform arbeidswet.".to_string()),
            key_facts: vec![
                KeyFact {
                    field: "standby_vergoeding".to_string(),
                    label: "Standby Vergoeding".to_string(),
                    value: "€ 2.45/uur".to_string(),
                    is_conflicting: false,
                },
                KeyFact {
                    field: "oproep_minimaal".to_string(),
                    label: "Minimale Uitbetaling".to_string(),
                    value: "3 uur aan 150%".to_string(),
                    is_conflicting: false,
                },
            ],
            tags: vec!["Wachtdienst".to_string(), "R&D".to_string(), "Overuren".to_string()],
            trust: TrustBreakdown {
                overall_score: 89.0,
                source_score: 90.0,
                recency_score: 92.0,
                consensus_score: 85.0,
                feedback_score: 90.0,
                is_authoritative: true,
                conflict_flag: false,
            },
            feedback: DocumentFeedback {
                verified_count: 4,
                outdated_count: 0,
                questionable_count: 0,
            },
        },

        // CUST-004: Vanderstraeten Bouwgroep NV
        DocumentItem {
            id: "DOC-008".to_string(),
            customer_id: "CUST-004".to_string(),
            title: "Arbeidsreglement PC 124 Bouw — Winter- en Weerverletregeling 2025".to_string(),
            source_type: DocumentSourceType::SignedContract,
            source_label: DocumentSourceType::SignedContract.label().to_string(),
            date: "2024-11-01".to_string(),
            author: "Luc Vanderstraeten & Bouwunie".to_string(),
            author_role: "Werkgever & Sociale Inspectie".to_string(),
            summary: "Vastlegging van de 40u-week met 12 toekenningsdagen (ADV) in de bouwsector, getrouwheidszegels en weerverletprocedure via Constructiv.".to_string(),
            raw_content: "PC 124 Bouwreglement. Wekelijks arbeidsregime 40u/week met 12 rustdagen ter compensatie (38u op jaarbasis). Weerverlet wegens vorst/regen wordt aangegeven via elektronische C3.2A en Constructiv toeslag.".to_string(),
            unmasked_raw_content: Some("PC 124 Bouwreglement. Wekelijks arbeidsregime 40u/week met 12 rustdagen ter compensatie (38u op jaarbasis). Weerverlet wegens vorst/regen wordt aangegeven via elektronische C3.2A en Constructiv toeslag.".to_string()),
            key_facts: vec![
                KeyFact {
                    field: "werkregime".to_string(),
                    label: "Wekelijks Werkregime".to_string(),
                    value: "40u/week (met 12 ADV)".to_string(),
                    is_conflicting: false,
                },
                KeyFact {
                    field: "mobiliteit".to_string(),
                    label: "Mobiliteitsvergoeding".to_string(),
                    value: "Volgens barema PC 124".to_string(),
                    is_conflicting: false,
                },
            ],
            tags: vec!["Bouw".to_string(), "PC 124".to_string(), "Weerverlet".to_string(), "ADV".to_string()],
            trust: TrustBreakdown {
                overall_score: 94.0,
                source_score: 100.0,
                recency_score: 85.0,
                consensus_score: 92.0,
                feedback_score: 98.0,
                is_authoritative: true,
                conflict_flag: false,
            },
            feedback: DocumentFeedback {
                verified_count: 6,
                outdated_count: 0,
                questionable_count: 0,
            },
        },

        // CUST-005: Grand Palace Hotel & Catering BV
        DocumentItem {
            id: "DOC-009".to_string(),
            customer_id: "CUST-005".to_string(),
            title: "Kaderovereenkomst Flexi-Job & Gelegenheidsarbeid PC 302".to_string(),
            source_type: DocumentSourceType::SignedContract,
            source_label: DocumentSourceType::SignedContract.label().to_string(),
            date: "2025-02-14".to_string(),
            author: "Annelies Maes".to_string(),
            author_role: "HR Coördinator Grand Palace".to_string(),
            summary: "Standaard raamcontract voor flexi-jobbers in de horeca inclusief minimum flexiloon, vakantiegeld (7.67%) en Dimona-Fli registraties.".to_string(),
            raw_content: "Flexi-arbeidsovereenkomst PC 302 Horeca. Uurloon conform sectoraal minimum inclusief 7.67% flexi-vakantiegeld, vrijgesteld van RSZ en bedrijfsvoorheffing mits 4/5e tewerkstelling bij hoofdwerkgever in T-3.".to_string(),
            unmasked_raw_content: Some("Flexi-arbeidsovereenkomst PC 302 Horeca. Uurloon conform sectoraal minimum inclusief 7.67% flexi-vakantiegeld, vrijgesteld van RSZ en bedrijfsvoorheffing mits 4/5e tewerkstelling bij hoofdwerkgever in T-3.".to_string()),
            key_facts: vec![
                KeyFact {
                    field: "flexi_regeling".to_string(),
                    label: "Flexi-job Toeslag".to_string(),
                    value: "Inclusief 7.67% vakantiegeld".to_string(),
                    is_conflicting: false,
                },
                KeyFact {
                    field: "dimona".to_string(),
                    label: "Dimona Type".to_string(),
                    value: "FLI (Flexi-job)".to_string(),
                    is_conflicting: false,
                },
            ],
            tags: vec!["Horeca".to_string(), "PC 302".to_string(), "Flexi-job".to_string(), "Dimona".to_string()],
            trust: TrustBreakdown {
                overall_score: 92.0,
                source_score: 100.0,
                recency_score: 94.0,
                consensus_score: 88.0,
                feedback_score: 85.0,
                is_authoritative: true,
                conflict_flag: false,
            },
            feedback: DocumentFeedback {
                verified_count: 4,
                outdated_count: 0,
                questionable_count: 0,
            },
        },
    ]
}

pub fn get_mock_employees() -> Vec<Employee> {
    let mut sarah_cust = HashMap::new();
    sarah_cust.insert("CUST-001".to_string(), 95.0);
    sarah_cust.insert("CUST-002".to_string(), 40.0);
    sarah_cust.insert("CUST-003".to_string(), 25.0);
    sarah_cust.insert("CUST-006".to_string(), 92.0);
    sarah_cust.insert("CUST-008".to_string(), 88.0);

    let mut sarah_dom = HashMap::new();
    sarah_dom.insert("Internationale Detachering & Expat".to_string(), 96.0);
    sarah_dom.insert("CAO 200 & Bediendenstatuut".to_string(), 94.0);
    sarah_dom.insert("Werkregime & Arbeidstijd".to_string(), 92.0);
    sarah_dom.insert("Tijdsregistratie & Overuren".to_string(), 70.0);
    sarah_dom.insert("Cafetariaplan & Flex Income".to_string(), 85.0);
    sarah_dom.insert("Voedingsnijverheid PC 118".to_string(), 90.0);
    sarah_dom.insert("Zorgsector PC 330 & IFIC".to_string(), 88.0);

    let mut emma_cust = HashMap::new();
    emma_cust.insert("CUST-001".to_string(), 72.0);
    emma_cust.insert("CUST-002".to_string(), 88.0);
    emma_cust.insert("CUST-003".to_string(), 50.0);
    emma_cust.insert("CUST-007".to_string(), 85.0);

    let mut emma_dom = HashMap::new();
    emma_dom.insert("Internationale Detachering & Expat".to_string(), 98.0);
    emma_dom.insert("CAO 200 & Bediendenstatuut".to_string(), 95.0);
    emma_dom.insert("Chemie & Petrochemie PC 207".to_string(), 96.0);
    emma_dom.insert("Metaalsector PC 111".to_string(), 90.0);
    emma_dom.insert("Werkregime & Arbeidstijd".to_string(), 89.0);
    emma_dom.insert("Cafetariaplan & Flex Income".to_string(), 92.0);

    let mut tom_cust = HashMap::new();
    tom_cust.insert("CUST-001".to_string(), 60.0);
    tom_cust.insert("CUST-002".to_string(), 30.0);
    tom_cust.insert("CUST-003".to_string(), 85.0);
    tom_cust.insert("CUST-004".to_string(), 94.0);

    let mut tom_dom = HashMap::new();
    tom_dom.insert("Bouwbedrijf PC 124".to_string(), 96.0);
    tom_dom.insert("Tijdsregistratie & Overuren".to_string(), 96.0);
    tom_dom.insert("Werkregime & Arbeidstijd".to_string(), 88.0);
    tom_dom.insert("CAO 200 & Bediendenstatuut".to_string(), 78.0);
    tom_dom.insert("Cafetariaplan & Flex Income".to_string(), 60.0);

    let mut kevin_cust = HashMap::new();
    kevin_cust.insert("CUST-001".to_string(), 35.0);
    kevin_cust.insert("CUST-002".to_string(), 15.0);
    kevin_cust.insert("CUST-003".to_string(), 20.0);
    kevin_cust.insert("CUST-005".to_string(), 90.0);

    let mut kevin_dom = HashMap::new();
    kevin_dom.insert("Horeca PC 302 & Flexi-jobs".to_string(), 92.0);
    kevin_dom.insert("Dimona & Studentenaangiften".to_string(), 88.0);
    kevin_dom.insert("Werkregime & Arbeidstijd".to_string(), 60.0);
    kevin_dom.insert("CAO 200 & Bediendenstatuut".to_string(), 55.0);

    let mut anouk_cust = HashMap::new();
    anouk_cust.insert("CUST-001".to_string(), 80.0);
    anouk_cust.insert("CUST-002".to_string(), 75.0);
    anouk_cust.insert("CUST-003".to_string(), 60.0);
    anouk_cust.insert("CUST-008".to_string(), 40.0);

    let mut anouk_dom = HashMap::new();
    anouk_dom.insert("Internationale Detachering & Expat".to_string(), 99.0);
    anouk_dom.insert("Fiscale optimalisatie & Bedrijfswagens".to_string(), 95.0);
    anouk_dom.insert("Cafetariaplan & Flex Income".to_string(), 94.0);
    anouk_dom.insert("CAO 200 & Bediendenstatuut".to_string(), 85.0);

    vec![
        Employee {
            id: "EMP-001".to_string(),
            name: "Sarah Vermeulen".to_string(),
            title: "Senior Payroll Officer & Expat Specialist".to_string(),
            department: "Enterprise Accounts Antwerpen".to_string(),
            extension: Some("4102".to_string()),
            direct_phone: Some("+32 3 220 41 02".to_string()),
            avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80".to_string(),
            availability: AvailabilityStatus::Available,
            completed_cases: 48,
            customer_familiarity: sarah_cust,
            domain_expertise: sarah_dom,
            recent_activity: "Loonindexering en grensarbeid afgerond voor Acme Logistics.".to_string(),
        },
        Employee {
            id: "EMP-002".to_string(),
            name: "Emma Wouters".to_string(),
            title: "Legal Advisor Sociaal Recht & Paritair Deskundige".to_string(),
            department: "SD Worx Kenniscentrum Sociaal Recht".to_string(),
            extension: Some("4108".to_string()),
            direct_phone: Some("+32 9 320 41 08".to_string()),
            avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80".to_string(),
            availability: AvailabilityStatus::Available,
            completed_cases: 39,
            customer_familiarity: emma_cust,
            domain_expertise: emma_dom,
            recent_activity: "A1-attesten en volcontinu ploegenstelsel BioHealth goedgekeurd.".to_string(),
        },
        Employee {
            id: "EMP-003".to_string(),
            name: "Tom De Smet".to_string(),
            title: "Payroll Consultant & Bouwspecialist PC 124".to_string(),
            department: "Workforce Solutions Hasselt & Brussel".to_string(),
            extension: Some("4115".to_string()),
            direct_phone: Some("+32 11 30 41 15".to_string()),
            avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80".to_string(),
            availability: AvailabilityStatus::Available,
            completed_cases: 31,
            customer_familiarity: tom_cust,
            domain_expertise: tom_dom,
            recent_activity: "Weerverlet en mobiliteitstoeslag verwerkt voor Vanderstraeten Bouw.".to_string(),
        },
        Employee {
            id: "EMP-004".to_string(),
            name: "Kevin Peeters".to_string(),
            title: "Junior Payroll Officer & Horeca Desk PC 302".to_string(),
            department: "Frontline ServiceDesk & Hospitality".to_string(),
            extension: Some("4122".to_string()),
            direct_phone: Some("+32 50 40 41 22".to_string()),
            avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80".to_string(),
            availability: AvailabilityStatus::Available,
            completed_cases: 18,
            customer_familiarity: kevin_cust,
            domain_expertise: kevin_dom,
            recent_activity: "Flexi-job contracten en weekendverwerking Grand Palace afgerond.".to_string(),
        },
        Employee {
            id: "EMP-005".to_string(),
            name: "Anouk Vandenberghe".to_string(),
            title: "Senior Tax & International Mobility Advisor".to_string(),
            department: "Executive & Expat Center".to_string(),
            extension: Some("4130".to_string()),
            direct_phone: Some("+32 2 770 41 30".to_string()),
            avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80".to_string(),
            availability: AvailabilityStatus::InCall,
            completed_cases: 42,
            customer_familiarity: anouk_cust,
            domain_expertise: anouk_dom,
            recent_activity: "Salary split en expat tax regime dossiers in behandeling.".to_string(),
        },
    ]
}

pub fn get_mock_users() -> Vec<crate::models::UserAccount> {
    use crate::models::{UserAccount, UserRole};

    let admin_hash = bcrypt::hash("Admin123!", 4).unwrap_or_default();
    let consultant_hash = bcrypt::hash("Payroll123!", 4).unwrap_or_default();

    vec![
        UserAccount {
            id: "USR-001".to_string(),
            username: "admin".to_string(),
            name: "System Administrator".to_string(),
            email: "admin@sdworx.com".to_string(),
            password_hash: admin_hash.clone(),
            role: UserRole::Admin,
            clearance_level: "Admin".to_string(),
            employee_id: None,
        },
        UserAccount {
            id: "USR-002".to_string(),
            username: "tom.desmet".to_string(),
            name: "Tom De Smet".to_string(),
            email: "tom.desmet@sdworx.com".to_string(),
            password_hash: consultant_hash.clone(),
            role: UserRole::Consultant,
            clearance_level: "Standard".to_string(),
            employee_id: Some("EMP-003".to_string()),
        },
        UserAccount {
            id: "USR-003".to_string(),
            username: "sarah.vermeulen".to_string(),
            name: "Sarah Vermeulen".to_string(),
            email: "sarah.vermeulen@sdworx.com".to_string(),
            password_hash: consultant_hash.clone(),
            role: UserRole::SeniorPayrollOfficer,
            clearance_level: "Senior".to_string(),
            employee_id: Some("EMP-001".to_string()),
        },
    ]
}

