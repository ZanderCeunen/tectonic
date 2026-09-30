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
            industry: "Logistics, Warehousing & Supply Chain".to_string(),
            joint_committee: "PC 200 - Joint Industrial Committee for White-Collar Workers".to_string(),
            joint_committee_code: Some("200".to_string()),
            primary_contact: "Marc Vanhove (HR Director)".to_string(),
            contact_email: "hr@acmelogistics.be".to_string(),
            contact_phone: Some("+32 3 205 11 00".to_string()),
            sdworx_account_manager: Some("Sarah Vermeulen".to_string()),
            sdworx_team: Some("Antwerp Enterprise - Team 4".to_string()),
            employee_count: 142,
            location: "Antwerp (Port)".to_string(),
            payroll_frequency: Some("Monthly (25th)".to_string()),
            active_dossier_status: Some("Active • Processing Q1".to_string()),
        },
        Customer {
            id: "CUST-002".to_string(),
            name: "BioHealth Solutions NV".to_string(),
            enterprise_number: "BE 0812.445.671".to_string(),
            customer_code: Some("SDW-81244".to_string()),
            industry: "Pharmaceuticals & Biotechnology".to_string(),
            joint_committee: "PC 207 - Chemical Industry".to_string(),
            joint_committee_code: Some("207".to_string()),
            primary_contact: "Karin De Meyer (Payroll Lead)".to_string(),
            contact_email: "k.demeyer@biohealth.be".to_string(),
            contact_phone: Some("+32 9 321 44 20".to_string()),
            sdworx_account_manager: Some("Emma Wouters".to_string()),
            sdworx_team: Some("Ghent Corporate & Life Sciences".to_string()),
            employee_count: 320,
            location: "Ghent (Zwijnaarde)".to_string(),
            payroll_frequency: Some("Monthly (28th)".to_string()),
            active_dossier_status: Some("Active • Continuous shift work".to_string()),
        },
        Customer {
            id: "CUST-003".to_string(),
            name: "Nexus Digital CommV".to_string(),
            enterprise_number: "BE 0799.312.118".to_string(),
            customer_code: Some("SDW-79931".to_string()),
            industry: "Software Engineering & Cloud Solutions".to_string(),
            joint_committee: "PC 200 - White-Collar Employees".to_string(),
            joint_committee_code: Some("200".to_string()),
            primary_contact: "Pieter Claes (CEO)".to_string(),
            contact_email: "p.claes@nexusdigital.io".to_string(),
            contact_phone: Some("+32 2 400 89 50".to_string()),
            sdworx_account_manager: Some("Tom De Smet".to_string()),
            sdworx_team: Some("Brussels SME Tech Hub".to_string()),
            employee_count: 28,
            location: "Brussels (Center)".to_string(),
            payroll_frequency: Some("Monthly (27th)".to_string()),
            active_dossier_status: Some("Active • Flexible Benefits 2026".to_string()),
        },
        Customer {
            id: "CUST-004".to_string(),
            name: "Vanderstraeten Bouwgroep NV".to_string(),
            enterprise_number: "BE 0418.992.341".to_string(),
            customer_code: Some("SDW-41899".to_string()),
            industry: "General Construction & Infrastructure".to_string(),
            joint_committee: "PC 124 - Construction Industry".to_string(),
            joint_committee_code: Some("124".to_string()),
            primary_contact: "Luc Vanderstraeten (Managing Director)".to_string(),
            contact_email: "personeel@vanderstraeten.be".to_string(),
            contact_phone: Some("+32 11 28 30 00".to_string()),
            sdworx_account_manager: Some("Tom De Smet".to_string()),
            sdworx_team: Some("Hasselt Construction Desk".to_string()),
            employee_count: 85,
            location: "Hasselt".to_string(),
            payroll_frequency: Some("Monthly (Manual & White-collar)".to_string()),
            active_dossier_status: Some("Active • Bad-weather days & Rest days".to_string()),
        },
        Customer {
            id: "CUST-005".to_string(),
            name: "Grand Palace Hotel & Catering BV".to_string(),
            enterprise_number: "BE 0652.188.904".to_string(),
            customer_code: Some("SDW-65218".to_string()),
            industry: "Hospitality, Hotels & Event Catering".to_string(),
            joint_committee: "PC 302 - Hotel & Catering Industry".to_string(),
            joint_committee_code: Some("302".to_string()),
            primary_contact: "Annelies Maes (HR Coordinator)".to_string(),
            contact_email: "hr@grandpalace.be".to_string(),
            contact_phone: Some("+32 50 44 12 30".to_string()),
            sdworx_account_manager: Some("Kevin Peeters".to_string()),
            sdworx_team: Some("Coast & Hospitality Desk".to_string()),
            employee_count: 54,
            location: "Bruges".to_string(),
            payroll_frequency: Some("Monthly + Flexi-jobs".to_string()),
            active_dossier_status: Some("Active • Seasonal Contracts".to_string()),
        },
        Customer {
            id: "CUST-006".to_string(),
            name: "Flanders Food Processing NV".to_string(),
            enterprise_number: "BE 0433.819.205".to_string(),
            customer_code: Some("SDW-43381".to_string()),
            industry: "Industrial Food Manufacturing".to_string(),
            joint_committee: "PC 118 - Food Industry".to_string(),
            joint_committee_code: Some("118".to_string()),
            primary_contact: "Dirk Vansteenkiste (Plant HR)".to_string(),
            contact_email: "d.vansteenkiste@flandersfood.be".to_string(),
            contact_phone: Some("+32 51 22 88 00".to_string()),
            sdworx_account_manager: Some("Sarah Vermeulen".to_string()),
            sdworx_team: Some("West Flanders Industrial Desk".to_string()),
            employee_count: 210,
            location: "Roeselare".to_string(),
            payroll_frequency: Some("Bi-weekly / Monthly".to_string()),
            active_dossier_status: Some("Active • Night and Shift Allowances".to_string()),
        },
        Customer {
            id: "CUST-007".to_string(),
            name: "Metaalconstructies De Smet & Zonen BV".to_string(),
            enterprise_number: "BE 0429.112.873".to_string(),
            customer_code: Some("SDW-42911".to_string()),
            industry: "Metal Processing & Precision Engineering".to_string(),
            joint_committee: "PC 111 - Metalworkers".to_string(),
            joint_committee_code: Some("111".to_string()),
            primary_contact: "Bart De Smet (Executive Director)".to_string(),
            contact_email: "admin@desmetmetaal.be".to_string(),
            contact_phone: Some("+32 15 34 10 90".to_string()),
            sdworx_account_manager: Some("Emma Wouters".to_string()),
            sdworx_team: Some("Mechelen Manufacturing Desk".to_string()),
            employee_count: 62,
            location: "Mechelen".to_string(),
            payroll_frequency: Some("Monthly".to_string()),
            active_dossier_status: Some("Active • Indexation 2026".to_string()),
        },
        Customer {
            id: "CUST-008".to_string(),
            name: "Zorgcampus Sint-Elisabeth VZW".to_string(),
            enterprise_number: "BE 0214.991.034".to_string(),
            customer_code: Some("SDW-21499".to_string()),
            industry: "Healthcare & Care Facilities".to_string(),
            joint_committee: "PC 330 - Healthcare Establishments".to_string(),
            joint_committee_code: Some("330".to_string()),
            primary_contact: "Hilde Goossens (HR Director)".to_string(),
            contact_email: "hr@sintelizabeth.be".to_string(),
            contact_phone: Some("+32 16 38 90 00".to_string()),
            sdworx_account_manager: Some("Sarah Vermeulen".to_string()),
            sdworx_team: Some("Non-Profit & Healthcare Desk".to_string()),
            employee_count: 450,
            location: "Leuven".to_string(),
            payroll_frequency: Some("Monthly (IFIC Scales)".to_string()),
            active_dossier_status: Some("Active • IFIC Classification".to_string()),
        },
    ]
}

pub fn get_mock_documents() -> Vec<DocumentItem> {
    vec![
        // CUST-001: Acme Logistics BV
        DocumentItem {
            id: "DOC-001".to_string(),
            customer_id: "CUST-001".to_string(),
            title: "Signed Employment Contract Addendum & Telework Policy 2024".to_string(),
            source_type: DocumentSourceType::SignedContract,
            source_label: DocumentSourceType::SignedContract.label().to_string(),
            date: "2024-05-12".to_string(),
            author: "Marc Vanhove & Executive Board".to_string(),
            author_role: "Client HR Board & SD Worx Legal".to_string(),
            summary: "Official signed addendum establishing the full-time working schedule of 38 hours/week, telework rules (max 2 days), and expense allowances.".to_string(),
            raw_content: "Agreement concluded between Acme Logistics BV and employee representatives. Article 3: The weekly work schedule for all white-collar employees under PC 200 is set at 38h/week across 5 working days. Telework permitted up to 2 days/week. Reference employee file RRN 85.04.12-***.**, account BE68 **** **** 7034. Base gross salary € [CONFIDENTIAL_SALARY].".to_string(),
            unmasked_raw_content: Some("Agreement concluded between Acme Logistics BV and employee representatives. Article 3: The weekly work schedule for all white-collar employees under PC 200 is set at 38h/week across 5 working days. Telework permitted up to 2 days/week. Reference employee file RRN 85.04.12-123.45, account BE68 5390 0754 7034. Base gross salary € 3,850.00 gross per month.".to_string()),
            file_path: None,
            file_name: None,
            file_size: None,
            key_facts: vec![
                KeyFact {
                    field: "work_schedule".to_string(),
                    label: "Weekly Work Schedule".to_string(),
                    value: "38h/week".to_string(),
                    is_conflicting: false,
                },
                KeyFact {
                    field: "telework".to_string(),
                    label: "Structural Telework".to_string(),
                    value: "2 days/week".to_string(),
                    is_conflicting: false,
                },
                KeyFact {
                    field: "joint_committee".to_string(),
                    label: "Joint Industrial Committee".to_string(),
                    value: "PC 200".to_string(),
                    is_conflicting: false,
                },
            ],
            tags: vec!["Contract".to_string(), "Working Hours".to_string(), "PC 200".to_string(), "Telework".to_string()],
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
            title: "SD Worx Sectoral Scale & Working Time Guideline PC 200".to_string(),
            source_type: DocumentSourceType::OfficialTemplate,
            source_label: DocumentSourceType::OfficialTemplate.label().to_string(),
            date: "2024-01-15".to_string(),
            author: "SD Worx Social Law Knowledge Center".to_string(),
            author_role: "SD Worx Legal Knowledge Center".to_string(),
            summary: "Official SD Worx sectoral guideline for white-collar staff under PC 200. Confirms statutory 38-hour week and indexation mechanisms.".to_string(),
            raw_content: "SD Worx Knowledge File PC 200. Standard working hours are 38h/week. Meal voucher employer contribution € 6.91 max (total € 8.00 per worked day).".to_string(),
            unmasked_raw_content: Some("SD Worx Knowledge File PC 200. Standard working hours are 38h/week. Meal voucher employer contribution € 6.91 max (total € 8.00 per worked day).".to_string()),
            file_path: None,
            file_name: None,
            file_size: None,
            key_facts: vec![
                KeyFact {
                    field: "work_schedule".to_string(),
                    label: "Weekly Work Schedule".to_string(),
                    value: "38h/week".to_string(),
                    is_conflicting: false,
                },
                KeyFact {
                    field: "meal_voucher".to_string(),
                    label: "Meal Voucher Face Value".to_string(),
                    value: "€ 8.00/day".to_string(),
                    is_conflicting: false,
                },
            ],
            tags: vec!["SD Worx Template".to_string(), "Salary Scale".to_string(), "PC 200".to_string()],
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
            title: "CRM Note - Quarterly HR Review & Expat Postings".to_string(),
            source_type: DocumentSourceType::CrmNote,
            source_label: DocumentSourceType::CrmNote.label().to_string(),
            date: "2025-03-10".to_string(),
            author: "Sarah Vermeulen".to_string(),
            author_role: "Senior Payroll Officer SD Worx".to_string(),
            summary: "Minutes from quarterly review with Marc Vanhove. Covered 3 cross-border expat postings to the Netherlands and confirmed the 38h schedule.".to_string(),
            raw_content: "Meeting with Marc Vanhove regarding cross-border telework. Frontier workers covered under EU A1 regulation with up to 49.9% remote work in home country. Regular hours remain 38h/week per Addendum 2024.".to_string(),
            unmasked_raw_content: Some("Meeting with Marc Vanhove regarding cross-border telework. Frontier workers covered under EU A1 regulation with up to 49.9% remote work in home country. Regular hours remain 38h/week per Addendum 2024.".to_string()),
            file_path: None,
            file_name: None,
            file_size: None,
            key_facts: vec![
                KeyFact {
                    field: "work_schedule".to_string(),
                    label: "Weekly Work Schedule".to_string(),
                    value: "38h/week".to_string(),
                    is_conflicting: false,
                },
                KeyFact {
                    field: "telework".to_string(),
                    label: "Structural Telework".to_string(),
                    value: "2 days/week".to_string(),
                    is_conflicting: false,
                },
            ],
            tags: vec!["CRM".to_string(), "Expat".to_string(), "International".to_string()],
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
            title: "ServiceDesk Ticket #421 - Public Holiday Compensation Inquiry".to_string(),
            source_type: DocumentSourceType::TicketComment,
            source_label: DocumentSourceType::TicketComment.label().to_string(),
            date: "2025-09-04".to_string(),
            author: "Kevin Peeters".to_string(),
            author_role: "Junior Payroll Consultant SD Worx".to_string(),
            summary: "Ticket reply where Kevin mistakenly notes that Acme Logistics operates on a 36h regime in response to a holiday compensation query.".to_string(),
            raw_content: "Dear Marc, for the holiday allowance calculation we assumed the 36h/week schedule applicable to the logistics warehouse. Please confirm for the September payroll run.".to_string(),
            unmasked_raw_content: Some("Dear Marc, for the holiday allowance calculation we assumed the 36h/week schedule applicable to the logistics warehouse. Please confirm for the September payroll run.".to_string()),
            file_path: None,
            file_name: None,
            file_size: None,
            key_facts: vec![
                KeyFact {
                    field: "work_schedule".to_string(),
                    label: "Weekly Work Schedule".to_string(),
                    value: "36h/week".to_string(),
                    is_conflicting: true,
                },
            ],
            tags: vec!["Ticket".to_string(), "Holidays".to_string(), "Working Hours".to_string()],
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
            title: "Teams Note - Annual Collective Closures 2026".to_string(),
            source_type: DocumentSourceType::ChatMessage,
            source_label: DocumentSourceType::ChatMessage.label().to_string(),
            date: "2026-01-14".to_string(),
            author: "Tom De Smet".to_string(),
            author_role: "Payroll Consultant SD Worx".to_string(),
            summary: "Brief Teams message noting agreed collective closure days around Christmas and Ascension Day.".to_string(),
            raw_content: "Marc confirmed via chat: company closes on Dec 24 and Dec 31 afternoon. Ascension bridge day approved by works council.".to_string(),
            unmasked_raw_content: Some("Marc confirmed via chat: company closes on Dec 24 and Dec 31 afternoon. Ascension bridge day approved by works council.".to_string()),
            file_path: None,
            file_name: None,
            file_size: None,
            key_facts: vec![
                KeyFact {
                    field: "bridge_days".to_string(),
                    label: "Fixed Bridge Days".to_string(),
                    value: "Ascension + Christmas Eve PM".to_string(),
                    is_conflicting: false,
                },
            ],
            tags: vec!["Teams".to_string(), "Leave".to_string()],
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
            title: "Company Collective Agreement Continuous Shift Work PC 207 (Registered 2024)".to_string(),
            source_type: DocumentSourceType::SignedContract,
            source_label: DocumentSourceType::SignedContract.label().to_string(),
            date: "2024-03-20".to_string(),
            author: "Karin De Meyer & SD Worx Legal".to_string(),
            author_role: "Works Council & SD Worx Legal Advisor".to_string(),
            summary: "Deposited collective labor agreement for 5-shift system in chemical manufacturing. Shift premium set at 27.5% for continuous night cycles.".to_string(),
            raw_content: "Collective Agreement BioHealth Solutions NV. Average working time 33.6h/week in 5-shift cycle with 12 compensation days per calendar year. Morning/Afternoon shift premium 12.5%, night 27.5%. Joint Committee 207.".to_string(),
            unmasked_raw_content: Some("Collective Agreement BioHealth Solutions NV. Average working time 33.6h/week in 5-shift cycle with 12 compensation days per calendar year. Morning/Afternoon shift premium 12.5%, night 27.5%. Joint Committee 207.".to_string()),
            file_path: None,
            file_name: None,
            file_size: None,
            key_facts: vec![
                KeyFact {
                    field: "shift_schedule".to_string(),
                    label: "Shift System".to_string(),
                    value: "33.6h/week (5-shift)".to_string(),
                    is_conflicting: false,
                },
                KeyFact {
                    field: "night_premium".to_string(),
                    label: "Night Shift Allowance".to_string(),
                    value: "27.5%".to_string(),
                    is_conflicting: false,
                },
                KeyFact {
                    field: "joint_committee".to_string(),
                    label: "Joint Industrial Committee".to_string(),
                    value: "PC 207".to_string(),
                    is_conflicting: false,
                },
            ],
            tags: vec!["Collective Agreement".to_string(), "Shift Work".to_string(), "PC 207".to_string()],
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
    sarah_dom.insert("International Mobility & Expat".to_string(), 96.0);
    sarah_dom.insert("CBA 200 & White-Collar Status".to_string(), 94.0);
    sarah_dom.insert("Working Hours & Schedules".to_string(), 92.0);
    sarah_dom.insert("Time Tracking & Overtime".to_string(), 70.0);
    sarah_dom.insert("Flexible Benefits & Cafeteria Plan".to_string(), 85.0);
    sarah_dom.insert("Food Industry PC 118".to_string(), 90.0);
    sarah_dom.insert("Healthcare PC 330 & IFIC".to_string(), 88.0);

    let mut emma_cust = HashMap::new();
    emma_cust.insert("CUST-001".to_string(), 72.0);
    emma_cust.insert("CUST-002".to_string(), 88.0);
    emma_cust.insert("CUST-003".to_string(), 50.0);
    emma_cust.insert("CUST-007".to_string(), 85.0);

    let mut emma_dom = HashMap::new();
    emma_dom.insert("International Mobility & Expat".to_string(), 98.0);
    emma_dom.insert("CBA 200 & White-Collar Status".to_string(), 95.0);
    emma_dom.insert("Chemical Industry PC 207".to_string(), 96.0);
    emma_dom.insert("Metal Industry PC 111".to_string(), 90.0);
    emma_dom.insert("Working Hours & Schedules".to_string(), 89.0);
    emma_dom.insert("Flexible Benefits & Cafeteria Plan".to_string(), 92.0);

    let mut tom_cust = HashMap::new();
    tom_cust.insert("CUST-001".to_string(), 60.0);
    tom_cust.insert("CUST-002".to_string(), 30.0);
    tom_cust.insert("CUST-003".to_string(), 85.0);
    tom_cust.insert("CUST-004".to_string(), 94.0);

    let mut tom_dom = HashMap::new();
    tom_dom.insert("Construction PC 124".to_string(), 96.0);
    tom_dom.insert("Time Tracking & Overtime".to_string(), 96.0);
    tom_dom.insert("Working Hours & Schedules".to_string(), 88.0);
    tom_dom.insert("CBA 200 & White-Collar Status".to_string(), 78.0);
    tom_dom.insert("Flexible Benefits & Cafeteria Plan".to_string(), 60.0);

    let mut kevin_cust = HashMap::new();
    kevin_cust.insert("CUST-001".to_string(), 35.0);
    kevin_cust.insert("CUST-002".to_string(), 15.0);
    kevin_cust.insert("CUST-003".to_string(), 20.0);
    kevin_cust.insert("CUST-005".to_string(), 90.0);

    let mut kevin_dom = HashMap::new();
    kevin_dom.insert("Hospitality PC 302 & Flexi-jobs".to_string(), 92.0);
    kevin_dom.insert("Dimona & Student Filings".to_string(), 88.0);
    kevin_dom.insert("Working Hours & Schedules".to_string(), 60.0);
    kevin_dom.insert("CBA 200 & White-Collar Status".to_string(), 55.0);

    let mut anouk_cust = HashMap::new();
    anouk_cust.insert("CUST-001".to_string(), 80.0);
    anouk_cust.insert("CUST-002".to_string(), 75.0);
    anouk_cust.insert("CUST-003".to_string(), 60.0);
    anouk_cust.insert("CUST-008".to_string(), 40.0);

    let mut anouk_dom = HashMap::new();
    anouk_dom.insert("International Mobility & Expat".to_string(), 99.0);
    anouk_dom.insert("Tax Optimization & Company Cars".to_string(), 95.0);
    anouk_dom.insert("Flexible Benefits & Cafeteria Plan".to_string(), 94.0);
    anouk_dom.insert("CBA 200 & White-Collar Status".to_string(), 85.0);

    vec![
        Employee {
            id: "EMP-001".to_string(),
            name: "Sarah Vermeulen".to_string(),
            title: "Senior Payroll Officer & Expat Specialist".to_string(),
            department: "Enterprise Accounts Antwerp".to_string(),
            extension: Some("4102".to_string()),
            direct_phone: Some("+32 3 220 41 02".to_string()),
            avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80".to_string(),
            availability: AvailabilityStatus::Available,
            completed_cases: 48,
            customer_familiarity: sarah_cust,
            domain_expertise: sarah_dom,
            recent_activity: "Completed wage indexation and cross-border telework review for Acme Logistics.".to_string(),
        },
        Employee {
            id: "EMP-002".to_string(),
            name: "Emma Wouters".to_string(),
            title: "Legal Advisor Labor Law & Collective Agreements".to_string(),
            department: "SD Worx Social Law Knowledge Center".to_string(),
            extension: Some("4108".to_string()),
            direct_phone: Some("+32 9 320 41 08".to_string()),
            avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80".to_string(),
            availability: AvailabilityStatus::Available,
            completed_cases: 39,
            customer_familiarity: emma_cust,
            domain_expertise: emma_dom,
            recent_activity: "Approved A1 certificates and continuous shift framework for BioHealth.".to_string(),
        },
        Employee {
            id: "EMP-003".to_string(),
            name: "Tom De Smet".to_string(),
            title: "Payroll Consultant & Construction Specialist PC 124".to_string(),
            department: "Workforce Solutions Hasselt & Brussels".to_string(),
            extension: Some("4115".to_string()),
            direct_phone: Some("+32 11 30 41 15".to_string()),
            avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80".to_string(),
            availability: AvailabilityStatus::Available,
            completed_cases: 31,
            customer_familiarity: tom_cust,
            domain_expertise: tom_dom,
            recent_activity: "Processed bad-weather and mobility allowances for Vanderstraeten Construction.".to_string(),
        },
        Employee {
            id: "EMP-004".to_string(),
            name: "Kevin Peeters".to_string(),
            title: "Payroll Officer & Hospitality Desk PC 302".to_string(),
            department: "Frontline ServiceDesk & Hospitality".to_string(),
            extension: Some("4122".to_string()),
            direct_phone: Some("+32 50 40 41 22".to_string()),
            avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80".to_string(),
            availability: AvailabilityStatus::Available,
            completed_cases: 18,
            customer_familiarity: kevin_cust,
            domain_expertise: kevin_dom,
            recent_activity: "Finalized flexi-job contracts and weekend filings for Grand Palace.".to_string(),
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
            recent_activity: "Handling salary split and expat tax regime cases.".to_string(),
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
            password_hash: admin_hash,
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
        UserAccount {
            id: "USR-004".to_string(),
            username: "emma.wouters".to_string(),
            name: "Emma Wouters".to_string(),
            email: "emma.wouters@sdworx.com".to_string(),
            password_hash: consultant_hash.clone(),
            role: UserRole::LegalAdvisor,
            clearance_level: "Senior".to_string(),
            employee_id: Some("EMP-002".to_string()),
        },
        UserAccount {
            id: "USR-005".to_string(),
            username: "kevin.peeters".to_string(),
            name: "Kevin Peeters".to_string(),
            email: "kevin.peeters@sdworx.com".to_string(),
            password_hash: consultant_hash,
            role: UserRole::Consultant,
            clearance_level: "Standard".to_string(),
            employee_id: Some("EMP-004".to_string()),
        },
    ]
}
