const fs = require('fs');
const path = require('path');

// Target directory
const VAULT_ROOT = path.join(__dirname, '..', 'Pharmacy-Study-Vault');

console.log(`Initializing study vault generation at: ${VAULT_ROOT}`);

// Create base directory
if (!fs.existsSync(VAULT_ROOT)) {
  fs.mkdirSync(VAULT_ROOT, { recursive: true });
}

// 1. Course definition arrays
const bpharmCourses = [
  // Semester I
  { sem: 'Sem1', code: 'BP101T', title: 'Basics of Python Programming for Pharmaceutical Sciences', category: 'Core', type: 'Theory', credits: 2, notes: '2L/wk', units: ['Introduction to Python', 'Control Structures', 'Functions and Modules', 'Data Science Applications'] },
  { sem: 'Sem1', code: 'BP102T', title: 'General Pharmacy', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem1', code: 'BP103T', title: 'Healthcare Psychology and Communication Skills', category: 'Core', type: 'Theory', credits: 1, notes: '1L/wk' },
  { sem: 'Sem1', code: 'BP104T', title: 'Human Anatomy, Physiology & Pathophysiology I', category: 'Core', type: 'Theory', credits: 4, notes: '4L/wk' },
  { sem: 'Sem1', code: 'BP105T', title: 'Introduction to Pharmacognosy', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem1', code: 'BP106T', title: 'Pharmaceutical Inorganic & Analytical Chemistry', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem1', code: 'BP107P', title: 'General Pharmacy Practical', category: 'Core', type: 'Practical', credits: 1, notes: '3P/wk' },
  { sem: 'Sem1', code: 'BP108P', title: 'Healthcare Psychology & Communication Skills Practical', category: 'Core', type: 'Practical', credits: 1, notes: '2P/wk' },
  { sem: 'Sem1', code: 'BP109P', title: 'Human Anatomy, Physiology & Pathophysiology I Practical', category: 'Core', type: 'Practical', credits: 1, notes: '3P/wk' },
  { sem: 'Sem1', code: 'BP110P', title: 'Introduction to Pharmacognosy Practical', category: 'Core', type: 'Practical', credits: 1, notes: '3P/wk' },
  { sem: 'Sem1', code: 'BP111P', title: 'Pharmaceutical Inorganic & Analytical Chem. Practical', category: 'Core', type: 'Practical', credits: 1, notes: '3P/wk' },

  // Semester II
  { sem: 'Sem2', code: 'BP201T', title: 'Applied Biostatistics & Data Analytics for Pharm. Sciences', category: 'Core', type: 'Theory', credits: 2, notes: '2L/wk' },
  { sem: 'Sem2', code: 'BP202T', title: 'Biochemistry', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem2', code: 'BP203T', title: 'Human Anatomy, Physiology & Pathophysiology II', category: 'Core', type: 'Theory', credits: 4, notes: '4L/wk' },
  { sem: 'Sem2', code: 'BP204T', title: 'Pharmaceutical Organic Chemistry', category: 'Core', type: 'Theory', credits: 4, notes: '4L/wk' },
  { sem: 'Sem2', code: 'BP205T', title: 'Pharmacognosy and Phytochemistry', category: 'Core', type: 'Theory', credits: 4, notes: '4L/wk' },
  { sem: 'Sem2', code: 'BP206T', title: 'Physical Pharmaceutics', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem2', code: 'BP207P', title: 'Biochemistry Practical', category: 'Core', type: 'Practical', credits: 1, notes: '3P/wk' },
  { sem: 'Sem2', code: 'BP208P', title: 'HAPPII Practical', category: 'Core', type: 'Practical', credits: 1, notes: '3P/wk' },
  { sem: 'Sem2', code: 'BP209P', title: 'Pharmaceutical Organic Chemistry Practical', category: 'Core', type: 'Practical', credits: 1, notes: '3P/wk' },
  { sem: 'Sem2', code: 'BP210P', title: 'Pharmacognosy & Phytochemistry Practical', category: 'Core', type: 'Practical', credits: 1, notes: '3P/wk' },
  { sem: 'Sem2', code: 'BP211P', title: 'Physical Pharmaceutics Practical', category: 'Core', type: 'Practical', credits: 1, notes: '3P/wk' },
  { sem: 'Sem2', code: 'BP212P-SEC1', title: 'Communication Skills (SEC)', category: 'SEC', type: 'Practical', credits: 1, notes: '2P/wk' },
  { sem: 'Sem2', code: 'BP212P-SEC2', title: 'Mental Well-Being, Stress & Conflict Management (SEC)', category: 'SEC', type: 'Practical', credits: 1, notes: '2P/wk' },
  { sem: 'Sem2', code: 'BP212P-SEC3', title: 'Fundamentals of Computer Operations (SEC)', category: 'SEC', type: 'Practical', credits: 1, notes: '2P/wk' },

  // Semester III
  { sem: 'Sem3', code: 'BP301T', title: 'Introduction to Machine Learning in Pharm. Sciences', category: 'Core', type: 'Theory', credits: 2, notes: '2L/wk' },
  { sem: 'Sem3', code: 'BP302T', title: 'Environmental Sciences', category: 'Core', type: 'Theory', credits: 1, notes: '1L/wk' },
  { sem: 'Sem3', code: 'BP303T', title: 'Ethics and Universal Human Values', category: 'Core', type: 'Theory', credits: 1, notes: '1L/wk' },
  { sem: 'Sem3', code: 'BP304T', title: 'General Pharmacology', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem3', code: 'BP305T', title: 'Heterocyclic Compounds & Stereochemistry', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem3', code: 'BP306T', title: 'Pharmaceutical Dosage Forms I', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem3', code: 'BP307T', title: 'Pharmaceutical Engineering', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem3', code: 'BP308T', title: 'Pharmaceutical Microbiology', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem3', code: 'BP309P', title: 'General Pharmacology Practical', category: 'Core', type: 'Practical', credits: 2, notes: '4P/wk' },
  { sem: 'Sem3', code: 'BP310P', title: 'Heterocyclic Comp. & Stereochemistry Practical', category: 'Core', type: 'Practical', credits: 2, notes: '4P/wk' },
  { sem: 'Sem3', code: 'BP311P', title: 'Pharmaceutical Dosage Forms I Practical', category: 'Core', type: 'Practical', credits: 1, notes: '3P/wk' },
  { sem: 'Sem3', code: 'BP312P-AEC1', title: 'Nutraceuticals & Functional Foods (AEC)', category: 'AEC', type: 'Practical', credits: 1, notes: '2P/wk' },
  { sem: 'Sem3', code: 'BP312P-AEC2', title: 'Food Analysis (AEC)', category: 'AEC', type: 'Practical', credits: 1, notes: '2P/wk' },
  { sem: 'Sem3', code: 'BP312P-AEC3', title: 'Yoga & Life Sciences (AEC)', category: 'AEC', type: 'Practical', credits: 1, notes: '2P/wk' },

  // Semester IV
  { sem: 'Sem4', code: 'BP401T', title: 'Herbal Drug Technology', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem4', code: 'BP402T', title: 'Medicinal Chemistry', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem4', code: 'BP403T', title: 'Pharmaceutical Biotechnology', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem4', code: 'BP404T', title: 'Social Pharmacy & Public Health', category: 'Core', type: 'Theory', credits: 2, notes: '2L/wk' },
  { sem: 'Sem4', code: 'BP405T', title: 'Systemic Pharmacology I', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem4', code: 'BP406P', title: 'Herbal Drug Technology Practical', category: 'Core', type: 'Practical', credits: 1, notes: '3P/wk' },
  { sem: 'Sem4', code: 'BP407P', title: 'Medicinal Chemistry Practical', category: 'Core', type: 'Practical', credits: 1, notes: '3P/wk' },
  { sem: 'Sem4', code: 'BP408P', title: 'Pharmaceutical Biotechnology Practical', category: 'Core', type: 'Practical', credits: 1, notes: '3P/wk' },
  { sem: 'Sem4', code: 'BP409P', title: 'Social Pharmacy & Public Health Practical', category: 'Core', type: 'Practical', credits: 1, notes: '2P/wk' },
  { sem: 'Sem4', code: 'BP410P', title: 'Systemic Pharmacology I Practical', category: 'Core', type: 'Practical', credits: 1, notes: '3P/wk' },
  { sem: 'Sem4', code: 'BP411I', title: 'Internship (Mandatory)', category: 'Internship', type: 'Field Work', credits: 4, notes: '8h/wk (120h block)' },

  // Semester V
  { sem: 'Sem5', code: 'BP501T', title: 'Biomedicinal Chemistry', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem5', code: 'BP502T', title: 'Industrial Pharmacognosy', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem5', code: 'BP503T', title: 'Innovation & Startup Ecosystem', category: 'Core', type: 'Theory', credits: 2, notes: '2L/wk' },
  { sem: 'Sem5', code: 'BP504T', title: 'Pharmaceutical Dosage Forms II', category: 'Core', type: 'Theory', credits: 2, notes: '2L/wk' },
  { sem: 'Sem5', code: 'BP505T', title: 'Pharmaceutical Quality Assurance', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem5', code: 'BP506T', title: 'Systemic Pharmacology II', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem5', code: 'BP507P', title: 'Biomedicinal Chemistry Practical', category: 'Core', type: 'Practical', credits: 2, notes: '4P/wk' },
  { sem: 'Sem5', code: 'BP508P', title: 'Industrial Pharmacognosy Practical', category: 'Core', type: 'Practical', credits: 1, notes: '3P/wk' },
  { sem: 'Sem5', code: 'BP509P', title: 'Pharmaceutical Dosage Forms II Practical', category: 'Core', type: 'Practical', credits: 1, notes: '3P/wk' },
  { sem: 'Sem5', code: 'BP510P', title: 'Systemic Pharmacology II Practical', category: 'Core', type: 'Practical', credits: 2, notes: '4P/wk' },

  // Semester VI
  { sem: 'Sem6', code: 'BP601T', title: 'Advanced Pharmacognosy', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem6', code: 'BP602T', title: 'Biopharmaceutics & Pharmacokinetics', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem6', code: 'BP603T', title: 'Intellectual Property Rights', category: 'Core', type: 'Theory', credits: 2, notes: '2L/wk' },
  { sem: 'Sem6', code: 'BP604T', title: 'AI Applications in Pharmaceutical Sciences', category: 'Core', type: 'Theory', credits: 2, notes: '2L/wk' },
  { sem: 'Sem6', code: 'BP605T', title: 'Pharmaceutical Analysis', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem6', code: 'BP606T', title: 'Pharmaceutical Jurisprudence', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem6', code: 'BP607T-AEC1', title: 'Green Chemistry (AEC)', category: 'AEC', type: 'Theory', credits: 1, notes: '1L/wk' },
  { sem: 'Sem6', code: 'BP607T-AEC2', title: 'Materiovigilance & Hemovigilance (AEC)', category: 'AEC', type: 'Theory', credits: 1, notes: '1L/wk' },
  { sem: 'Sem6', code: 'BP607T-AEC3', title: 'Scientific Writing (AEC)', category: 'AEC', type: 'Theory', credits: 1, notes: '1L/wk' },
  { sem: 'Sem6', code: 'BP607T-AEC4', title: 'Drug Store & Business Management (AEC)', category: 'AEC', type: 'Theory', credits: 1, notes: '1L/wk' },
  { sem: 'Sem6', code: 'BP607T-AEC5', title: 'Career Building in Medicinal Plants (AEC)', category: 'AEC', type: 'Theory', credits: 1, notes: '1L/wk' },
  { sem: 'Sem6', code: 'BP607T-AEC6', title: 'API & Excipient Sciences (AEC)', category: 'AEC', type: 'Theory', credits: 1, notes: '1L/wk' },
  { sem: 'Sem6', code: 'BP608P', title: 'Biopharmaceutics & Pharmacokinetics Practical', category: 'Core', type: 'Practical', credits: 1, notes: '3P/wk' },
  { sem: 'Sem6', code: 'BP609P', title: 'Pharmaceutical Analysis Practical', category: 'Core', type: 'Practical', credits: 2, notes: '4P/wk' },
  { sem: 'Sem6', code: 'BP610P-SEC1', title: 'Computer-Aided Drug Design (SEC)', category: 'SEC', type: 'Practical', credits: 1, notes: '2P/wk' },
  { sem: 'Sem6', code: 'BP610P-SEC2', title: 'Analytical Method Development & Validation (SEC)', category: 'SEC', type: 'Practical', credits: 1, notes: '2P/wk' },
  { sem: 'Sem6', code: 'BP610P-SEC3', title: 'Principles of Preclinical Studies (SEC)', category: 'SEC', type: 'Practical', credits: 1, notes: '2P/wk' },
  { sem: 'Sem6', code: 'BP612I', title: 'Internship (Mandatory)', category: 'Internship', type: 'Field Work', credits: 4, notes: '8h/wk (120h block)' },

  // Semester VII
  { sem: 'Sem7', code: 'BP701T', title: 'Biostatistics & Research Methodology', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem7', code: 'BP702T', title: 'Cosmetics & Cosmeceuticals', category: 'Core', type: 'Theory', credits: 2, notes: '2L/wk' },
  { sem: 'Sem7', code: 'BP703T', title: 'AI in Clinical Applications', category: 'Core', type: 'Theory', credits: 2, notes: '2L/wk' },
  { sem: 'Sem7', code: 'BP704T', title: 'Modern Analytical Techniques', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem7', code: 'BP705T', title: 'Pharmacovigilance', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem7', code: 'BP706T', title: 'Pharmacy Practice', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem7', code: 'BP707T', title: 'Regulatory Affairs', category: 'Core', type: 'Theory', credits: 2, notes: '2L/wk' },
  { sem: 'Sem7', code: 'BP708T-AEC1', title: 'cGMP (Current Good Manufacturing Practices) (AEC)', category: 'AEC', type: 'Theory', credits: 1, notes: '1L/wk' },
  { sem: 'Sem7', code: 'BP708T-AEC2', title: 'Pharmaceutical Automation (AEC)', category: 'AEC', type: 'Theory', credits: 1, notes: '1L/wk' },
  { sem: 'Sem7', code: 'BP708T-AEC3', title: 'Modern Techniques in Cellular Biology (AEC)', category: 'AEC', type: 'Theory', credits: 1, notes: '1L/wk' },
  { sem: 'Sem7', code: 'BP708T-AEC4', title: 'Medical Devices (AEC)', category: 'AEC', type: 'Theory', credits: 1, notes: '1L/wk' },
  { sem: 'Sem7', code: 'BP708T-AEC5', title: 'Food Waste -> Medicinal Products (AEC)', category: 'AEC', type: 'Theory', credits: 1, notes: '1L/wk' },
  { sem: 'Sem7', code: 'BP708T-AEC6', title: 'Biosimilars, Vaccines & Macromolecules (AEC)', category: 'AEC', type: 'Theory', credits: 1, notes: '1L/wk' },
  { sem: 'Sem7', code: 'BP709P', title: 'Modern Analytical Techniques Practical', category: 'Core', type: 'Practical', credits: 1, notes: '3P/wk' },
  { sem: 'Sem7', code: 'BP710RP', title: 'Research Project (Part I)', category: 'Project', type: 'Project', credits: 6, notes: '6 credits' },

  // Semester VIII
  { sem: 'Sem8', code: 'BP801T', title: 'Ethical Considerations & Translational AI in Pharmacy', category: 'Core', type: 'Theory', credits: 2, notes: '2L/wk' },
  { sem: 'Sem8', code: 'BP802T', title: 'Clinical Pharmacotherapeutics', category: 'Core', type: 'Theory', credits: 2, notes: '2L/wk' },
  { sem: 'Sem8', code: 'BP803T', title: 'Industrial Pharmacy & Facility Design', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem8', code: 'BP804T', title: 'Pharmaceutical Management', category: 'Core', type: 'Theory', credits: 2, notes: '2L/wk' },
  { sem: 'Sem8', code: 'BP805T', title: 'Sterile Dosage Forms & Novel Drug Delivery System', category: 'Core', type: 'Theory', credits: 3, notes: '3L/wk' },
  { sem: 'Sem8', code: 'BP806T-AEC1', title: 'Pharmaceutical Packaging (AEC)', category: 'AEC', type: 'Theory', credits: 2, notes: '2L/wk' },
  { sem: 'Sem8', code: 'BP806T-AEC2', title: 'Supply Chain Management (AEC)', category: 'AEC', type: 'Theory', credits: 2, notes: '2L/wk' },
  { sem: 'Sem8', code: 'BP806T-AEC3', title: 'Industrial Safety & Waste Mgmt (AEC)', category: 'AEC', type: 'Theory', credits: 2, notes: '2L/wk' },
  { sem: 'Sem8', code: 'BP806T-AEC4', title: 'Traditional Healing Practices of India (AEC)', category: 'AEC', type: 'Theory', credits: 2, notes: '2L/wk' },
  { sem: 'Sem8', code: 'BP806T-AEC5', title: 'Futuristic Pharma/AR/VR (Pharma 4.0) (AEC)', category: 'AEC', type: 'Theory', credits: 2, notes: '2L/wk' },
  { sem: 'Sem8', code: 'BP806T-AEC6', title: 'Herbal Cosmetics (AEC)', category: 'AEC', type: 'Theory', credits: 2, notes: '2L/wk' },
  { sem: 'Sem8', code: 'BP807P', title: 'Pharmaceutical Marketing Skills Practical', category: 'Core', type: 'Practical', credits: 1, notes: '2P/wk' },
  { sem: 'Sem8', code: 'BP808P', title: 'Sterile Dosage Forms & NDDS Practical', category: 'Core', type: 'Practical', credits: 2, notes: '4P/wk' },
  { sem: 'Sem8', code: 'BP809P-VAC1', title: 'Cleaning & Validation (VAC)', category: 'VAC', type: 'Practical', credits: 1, notes: '2P/wk' },
  { sem: 'Sem8', code: 'BP809P-VAC2', title: 'Aseptic Handling (VAC)', category: 'VAC', type: 'Practical', credits: 1, notes: '2P/wk' },
  { sem: 'Sem8', code: 'BP809P-VAC3', title: 'Impurity Profiling (VAC)', category: 'VAC', type: 'Practical', credits: 1, notes: '2P/wk' },
  { sem: 'Sem8', code: 'BP810RP', title: 'Research Project (Part II)', category: 'Project', type: 'Project', credits: 6, notes: '6 credits' }
];

const dpharmCourses = [
  // Year I
  { year: 'Year1', code: 'ER20-11T', title: 'Pharmaceutics', category: 'Core', type: 'Theory', credits: 'UNSPECIFIED', notes: '3L/wk (75h total)' },
  { year: 'Year1', code: 'ER20-11P', title: 'Pharmaceutics Practical', category: 'Core', type: 'Practical', credits: 'UNSPECIFIED', notes: '3P/wk (75h total)' },
  { year: 'Year1', code: 'ER20-12T', title: 'Pharmaceutical Chemistry', category: 'Core', type: 'Theory', credits: 'UNSPECIFIED', notes: '3L/wk (75h total)' },
  { year: 'Year1', code: 'ER20-12P', title: 'Pharmaceutical Chemistry Practical', category: 'Core', type: 'Practical', credits: 'UNSPECIFIED', notes: '3P/wk (75h total)' },
  { year: 'Year1', code: 'ER20-13T', title: 'Pharmacognosy', category: 'Core', type: 'Theory', credits: 'UNSPECIFIED', notes: '3L/wk (75h total)' },
  { year: 'Year1', code: 'ER20-13P', title: 'Pharmacognosy Practical', category: 'Core', type: 'Practical', credits: 'UNSPECIFIED', notes: '3P/wk (75h total)' },
  { year: 'Year1', code: 'ER20-14T', title: 'Human Anatomy & Physiology', category: 'Core', type: 'Theory', credits: 'UNSPECIFIED', notes: '3L/wk (75h total)' },
  { year: 'Year1', code: 'ER20-14P', title: 'Human Anatomy & Physiology Practical', category: 'Core', type: 'Practical', credits: 'UNSPECIFIED', notes: '3P/wk (75h total)' },
  { year: 'Year1', code: 'ER20-15T', title: 'Social Pharmacy', category: 'Core', type: 'Theory', credits: 'UNSPECIFIED', notes: '3L/wk (75h total)' },
  { year: 'Year1', code: 'ER20-15P', title: 'Social Pharmacy Practical', category: 'Core', type: 'Practical', credits: 'UNSPECIFIED', notes: '3P/wk (75h total)' },

  // Year II
  { year: 'Year2', code: 'ER20-21T', title: 'Pharmacology', category: 'Core', type: 'Theory', credits: 'UNSPECIFIED', notes: '3L/wk (75h total)' },
  { year: 'Year2', code: 'ER20-21P', title: 'Pharmacology Practical', category: 'Core', type: 'Practical', credits: 'UNSPECIFIED', notes: '2P/wk (50h total)' },
  { year: 'Year2', code: 'ER20-22T', title: 'Community Pharmacy & Mgmt', category: 'Core', type: 'Theory', credits: 'UNSPECIFIED', notes: '3L/wk (75h total)' },
  { year: 'Year2', code: 'ER20-22P', title: 'Community Pharmacy Practical', category: 'Core', type: 'Practical', credits: 'UNSPECIFIED', notes: '3P/wk (75h total)' },
  { year: 'Year2', code: 'ER20-23T', title: 'Biochemistry & Clin. Pathology', category: 'Core', type: 'Theory', credits: 'UNSPECIFIED', notes: '3L/wk (75h total)' },
  { year: 'Year2', code: 'ER20-23P', title: 'Biochemistry & Clin. Pathology Practical', category: 'Core', type: 'Practical', credits: 'UNSPECIFIED', notes: '2P/wk (50h total)' },
  { year: 'Year2', code: 'ER20-24T', title: 'Pharmacotherapeutics', category: 'Core', type: 'Theory', credits: 'UNSPECIFIED', notes: '3L/wk (75h total)' },
  { year: 'Year2', code: 'ER20-24P', title: 'Pharmacotherapeutics Practical', category: 'Core', type: 'Practical', credits: 'UNSPECIFIED', notes: '1P/wk (25h total)' },
  { year: 'Year2', code: 'ER20-25T', title: 'Hospital & Clinical Pharmacy', category: 'Core', type: 'Theory', credits: 'UNSPECIFIED', notes: '3L/wk (75h total)' },
  { year: 'Year2', code: 'ER20-25P', title: 'Hospital & Clinical Pharmacy Practical', category: 'Core', type: 'Practical', credits: 'UNSPECIFIED', notes: '1P/wk (25h total)' },
  { year: 'Year2', code: 'ER20-26T', title: 'Pharmacy Law & Ethics', category: 'Core', type: 'Theory', credits: 'UNSPECIFIED', notes: '3L/wk (75h total)' },
  { year: 'Year2', code: 'ER20-26P', title: 'Pharmacy Law & Ethics Practical', category: 'Core', type: 'Practical', credits: 'UNSPECIFIED', notes: '1P/wk (25h total)' }
];

// Helper to sanitize folder name
function getFolderName(code, title) {
  const cleanTitle = title.replace(/[^a-zA-Z0-9\s&()]/g, '').trim().replace(/\s+/g, '_');
  return `${code}_${cleanTitle}`;
}

// 2. Write 00_Meta files
const metaDir = path.join(VAULT_ROOT, '00_Meta');
if (!fs.existsSync(metaDir)) {
  fs.mkdirSync(metaDir, { recursive: true });
}

// Evaluation rules
const evaluationRulesContent = `# PCI Academic Evaluation & Policy Rules

## Attendance Policy
- **Minimum Requirement**: **75% attendance** in each course (both theory and practical classes separately) is mandatory to be eligible to appear for the university examinations. **[31†L641-L649]**

## Passing Criteria
- **Minimum Marks**: A student must secure a minimum of **50% marks** in each course (combining both internal assessment and external university examinations) to pass and earn the respective credits.

## Credit Structure
- **B.Pharm NEP-2020**: 8 semesters, total **193 credits**
- **D.Pharm ER-2020**: 2 years, total **80 credits equivalence**

## Academic Progression & Assessment
- Internal sessional exams are conducted periodically.
- Letter grades and GPA are calculated based on absolute/relative grading regulations of PCI.
`;
fs.writeFileSync(path.join(metaDir, 'Evaluation-Rules.md'), evaluationRulesContent);

// Academic calendar
const academicCalendarContent = `# Academic Calendar

## Semesters / Year Blocks
- **Odd Semesters (I, III, V, VII)**: Usually run from July/August to December.
- **Even Semesters (II, IV, VI, VIII)**: Usually run from January to May/June.
- **D.Pharm Year Blocks**: Year-long instruction from August/September to May/June.

## Sessional Assessments
- First Sessional Exam: ~8th week of instruction
- Second Sessional Exam: ~14th week of instruction
- End-Semester/Year University Exams: Post 16th week of instruction
`;
fs.writeFileSync(path.join(metaDir, 'Academic-Calendar.md'), academicCalendarContent);

// Templates definitions
const templates = {
  'Internship_Log_Template.md': `# Internship Log Book & Daily Diary

- **Student Name:** [Your Name]
- **College/Institute:** [Institution Name]
- **Place of Internship:** [Company / Hospital / Laboratory]
- **Duration:** [Start Date – End Date]
- **Weekly Hours:** [e.g. 8 hours/week]

## Daily Log Log
| Date       | Tasks Performed                         | Hours Spent | Supervisor Signature/Remark |
|------------|-----------------------------------------|-------------|-----------------------------|
| [Day 1]    | [Task description]                      | [#hrs]      |                             |
| [Day 2]    | [Task description]                      | [#hrs]      |                             |

## Comments / Learnings:
- [Reflection on tasks, skills learned, challenges, etc.]
`,
  'Internship_Report_Template.md': `# Internship Report Outline

## 1. Introduction
- Overview of internship organization (name, department, location).
- Objectives of the internship.

## 2. Company/Institution Profile
- Operations, product lines, certifications (WHO-GMP, ISO, etc.).

## 3. Weekly Activity Summary
- Detailed description of tasks performed under supervision.

## 4. Skills and Learnings Acquired
- Equipment operated, analysis methods performed, GMP guidelines observed.

## 5. Conclusions and Recommendations
`,
  'Internship_Checklist.md': `# Internship Submission Checklist

- [ ] Internship Offer / Joining Letter
- [ ] Weekly Attendance Sheet (Signed by industry supervisor)
- [ ] Completed Daily Log Book
- [ ] Printed Internship Report
- [ ] Evaluation Sheet from Industry Mentor
- [ ] College Submission Receipt
`,
  'Research_Project_PartI_Template.md': `# Research Project Part I — Proposal & Literature Review

## Title: [Project Title]

### 1. Proposal Overview
- **Introduction & Background**:
- **Problem Statement**:
- **Aims and Objectives**:

### 2. Literature Review
- [Summary of key papers, patents, and current state-of-the-art]

### 3. Proposed Methodology
- [Experimental design, materials, tools, analytical procedures]

### 4. Work Plan & Project Timeline
- [Gantt chart or milestone dates for Sem VII and VIII]
`,
  'Research_Project_PartII_Template.md': `# Research Project Part II — Experiments, Analysis & Defense

## Title: [Final Project Title]

### 1. Abstract
- [150-250 word summary of findings]

### 2. Introduction & Theory
- [Literature background update]

### 3. Materials and Methods
- [Verbatim experimental steps and instrumentation]

### 4. Results & Discussion
- [Data tables, graphs, chromatography prints, statistical analysis]

### 5. Conclusion
- [Final summary and future prospects]

### 6. References
- [Standard citation style, e.g. Vancouver or Harvard]
`,
  'Revision_Sheet_Template.md': `# Revision Sheet

**Subject**: [Course Name & Code]  
**Key Definitions**:
- [Term 1]: [Definition]
- [Term 2]: [Definition]

**Important Formulas & Reactions**:
- [Reaction 1]
- [Formula 1]

**Quick Unit Summaries**:
- **Unit 1**:
- **Unit 2**:
- **Unit 3**:
- **Unit 4**:
- **Unit 5**:
`,
  'PYQ_Tracker_Template.md': `# Previous Year Questions (PYQ) Tracker

**Course**: [Course Code - Title]

## PYQ Checklist & Frequency Analysis

| Question / Topic | Year(s) Asked | Marks Weightage | Preparation Status |
|------------------|---------------|-----------------|--------------------|
| [Question A]     | 2024, 2022    | 10 Marks        | [ ] Prepared / [ ] Reviewed |
| [Question B]     | 2023          | 5 Marks         | [ ] Prepared / [ ] Reviewed |
`,
  'Mindmap_Template.md': `# Subject Mindmap Outline

**Central Topic: [Subject Title]**

1. **Branch A**: [Main Topic 1]
   - [Sub-topic 1.1]
   - [Sub-topic 1.2]
2. **Branch B**: [Main Topic 2]
   - [Sub-topic 2.1]
   - [Sub-topic 2.2]
`,
  'Weekly_Study_Plan_Template.md': `# Weekly Study Plan

| Day | Subject & Topic | Time Allocation | Tasks (Notes/PYQs/Revision) | Completed? |
|-----|-----------------|-----------------|------------------------------|------------|
| Monday | | | | [ ] |
| Tuesday | | | | [ ] |
| Wednesday | | | | [ ] |
| Thursday | | | | [ ] |
| Friday | | | | [ ] |
| Saturday | | | | [ ] |
| Sunday | | | | [ ] |
`
};

// Write templates to meta folder
for (const [name, content] of Object.entries(templates)) {
  fs.writeFileSync(path.join(metaDir, name), content);
}

// 3. Generate B.Pharm folder structure
const bpharmRoot = path.join(VAULT_ROOT, '01_B.Pharm_NEP2020');
if (!fs.existsSync(bpharmRoot)) {
  fs.mkdirSync(bpharmRoot, { recursive: true });
}

bpharmCourses.forEach(c => {
  const semDir = path.join(bpharmRoot, c.sem);
  const courseFolder = getFolderName(c.code, c.title);
  const coursePath = path.join(semDir, courseFolder);

  // Create course directory
  if (!fs.existsSync(coursePath)) {
    fs.mkdirSync(coursePath, { recursive: true });
  }

  // Create standard sub-structure
  fs.writeFileSync(path.join(coursePath, '01_Notes.md'), `# Study Notes - ${c.title}\n\nStart compiling notes here.\n`);
  
  // Create 02_Units for Theory courses
  if (c.type === 'Theory') {
    const unitsDir = path.join(coursePath, '02_Units');
    if (!fs.existsSync(unitsDir)) {
      fs.mkdirSync(unitsDir);
    }
    
    // Check if custom units are defined
    const unitList = c.units || ['Foundations & Basic Principles', 'Core Concepts & Mechanisms', 'Advanced Topics & Analytics', 'Systems & Formulations', 'Practical Applications & Case Studies'];
    unitList.forEach((u, i) => {
      const idx = String(i + 1).padStart(2, '0');
      const unitContent = `# Unit ${i + 1}: ${u}

**Learning Outcomes:**
- Understand core concepts of ${u}.
- List important diagrams, classifications, and parameters.

**Must-Know Concepts:**
- [Concept 1]
- [Concept 2]

**Sample Exam Questions:**
1. Explain the mechanism and significance of ${u}.
2. Draw detailed schematics/flowcharts where applicable.
`;
      fs.writeFileSync(path.join(unitsDir, `UNIT-${idx}_README.md`), unitContent);
    });
  }

  // Other directories
  const pyqDir = path.join(coursePath, '03_PYQ-and-MCQs');
  const mmDir = path.join(coursePath, '04_Mindmaps');
  const revDir = path.join(coursePath, '05_Revision-Sheets');
  
  if (!fs.existsSync(pyqDir)) fs.mkdirSync(pyqDir);
  if (!fs.existsSync(mmDir)) fs.mkdirSync(mmDir);
  if (!fs.existsSync(revDir)) fs.mkdirSync(revDir);

  // Write base files inside folders
  fs.writeFileSync(path.join(pyqDir, 'README.md'), `# Previous Year Questions & MCQ Bank\n`);
  fs.writeFileSync(path.join(mmDir, 'README.md'), `# Mindmaps & Visualization Resources\n`);
  fs.writeFileSync(path.join(revDir, 'README.md'), `# Revision Summaries & Formula Sheets\n`);

  // Create 06_Practicals/ only if a practical counterpart exists
  // For B.Pharm, we can detect if there's a practical course in the same semester with matching suffix
  const hasPractical = bpharmCourses.some(other => other.sem === c.sem && other.type === 'Practical' && other.code.substring(2, 5) === c.code.substring(2, 5));
  if (c.type === 'Theory' && hasPractical) {
    const pracDir = path.join(coursePath, '06_Practicals');
    if (!fs.existsSync(pracDir)) fs.mkdirSync(pracDir);
    fs.writeFileSync(path.join(pracDir, 'README.md'), `# Practical Component Mapping\n\nRefer to the corresponding practical course folder in this semester.\n`);
  }

  // Co-requisites & Links file
  // Find matching practical course code
  let coreqCode = 'None';
  if (c.type === 'Theory') {
    const matchingPrac = bpharmCourses.find(other => other.sem === c.sem && other.type === 'Practical' && other.code.substring(2, 5) === c.code.substring(2, 5));
    if (matchingPrac) coreqCode = matchingPrac.code;
  } else if (c.type === 'Practical') {
    const matchingTheory = bpharmCourses.find(other => other.sem === c.sem && other.type === 'Theory' && other.code.substring(2, 5) === c.code.substring(2, 5));
    if (matchingTheory) coreqCode = matchingTheory.code;
  }

  const linksContent = `# Co-requisites and Links

## Curriculum Status
- **Program**: B.Pharm (NEP 2020)
- **Semester**: ${c.sem}
- **Category**: ${c.category}
- **Credits**: ${c.credits}

## Mapped Relationships
- **Prerequisites**: UNSPECIFIED IN SOURCE
- **Co-requisites**: ${coreqCode !== 'None' ? `[${coreqCode}]` : 'UNSPECIFIED IN SOURCE'}
- **Suggested Learning Track**: AI/Data Science, Formulation, Pharmacology, etc. (depending on syllabus)

## Links to Metadata Templates
- [Weekly Study Plan](../../../00_Meta/Weekly_Study_Plan_Template.md)
- [Revision Sheet Template](../../../00_Meta/Revision_Sheet_Template.md)
- [PYQ Tracker Template](../../../00_Meta/PYQ_Tracker_Template.md)
`;
  fs.writeFileSync(path.join(coursePath, '07_Co-requisites-and-Links.md'), linksContent);

  // Master Course README.md
  const readmeContent = `# ${c.code} — ${c.title}

- **Program**: B.Pharm (NEP 2020)
- **Semester**: ${c.sem}
- **Credits**: ${c.credits}
- **Category**: ${c.category}
- **Type**: ${c.type}
- **Notes**: ${c.notes}

## Course Overview
This study folder is organized to match the official PCI B.Pharm curriculum requirements. 
Maintain sessional and end-semester syllabus topics under respective folders.

## Folder Structure
- \`01_Notes.md\` — General notes and class summaries.
- \`02_Units/\` — Unit-wise chapter breakdowns.
- \`03_PYQ-and-MCQs/\` — Solved papers and question tracker.
- \`04_Mindmaps/\` — Visual flowcharts and diagrams.
- \`05_Revision-Sheets/\` — Formula lists and summary sheets.
${c.type === 'Theory' && hasPractical ? '- `06_Practicals/` — Labs mapping.\n' : ''}- \`07_Co-requisites-and-Links.md\` — Related courses and syllabus links.
`;
  fs.writeFileSync(path.join(coursePath, 'README.md'), readmeContent);
});

// 4. Generate D.Pharm folder structure
const dpharmRoot = path.join(VAULT_ROOT, '02_D.Pharm_ER20');
if (!fs.existsSync(dpharmRoot)) {
  fs.mkdirSync(dpharmRoot, { recursive: true });
}

dpharmCourses.forEach(c => {
  const yearDir = path.join(dpharmRoot, c.year);
  const courseFolder = getFolderName(c.code, c.title);
  const coursePath = path.join(yearDir, courseFolder);

  // Create course directory
  if (!fs.existsSync(coursePath)) {
    fs.mkdirSync(coursePath, { recursive: true });
  }

  // Create standard sub-structure
  fs.writeFileSync(path.join(coursePath, '01_Notes.md'), `# Study Notes - ${c.title}\n\nStart compiling notes here.\n`);
  
  // Create 02_Units for Theory courses
  if (c.type === 'Theory') {
    const unitsDir = path.join(coursePath, '02_Units');
    if (!fs.existsSync(unitsDir)) {
      fs.mkdirSync(unitsDir);
    }
    
    // Generate 5 chapters/units for D.Pharm
    for (let i = 1; i <= 5; i++) {
      const idx = String(i).padStart(2, '0');
      const unitContent = `# Chapter ${i}: Chapter Overview

**Learning Outcomes:**
- Understand core concepts of Chapter ${i}.
- List key drugs, dosage forms, or clinical practices as defined in ER-2020.

**Must-Know Concepts:**
- [Concept 1]
- [Concept 2]

**Sample Exam Questions:**
1. Define and explain the principles of Chapter ${i}.
`;
      fs.writeFileSync(path.join(unitsDir, `UNIT-${idx}_README.md`), unitContent);
    }
  }

  // Other directories
  const pyqDir = path.join(coursePath, '03_PYQ-and-MCQs');
  const mmDir = path.join(coursePath, '04_Mindmaps');
  const revDir = path.join(coursePath, '05_Revision-Sheets');
  
  if (!fs.existsSync(pyqDir)) fs.mkdirSync(pyqDir);
  if (!fs.existsSync(mmDir)) fs.mkdirSync(mmDir);
  if (!fs.existsSync(revDir)) fs.mkdirSync(revDir);

  // Write base files inside folders
  fs.writeFileSync(path.join(pyqDir, 'README.md'), `# Previous Year Questions & MCQ Bank\n`);
  fs.writeFileSync(path.join(mmDir, 'README.md'), `# Mindmaps & Visualization Resources\n`);
  fs.writeFileSync(path.join(revDir, 'README.md'), `# Revision Summaries & Formula Sheets\n`);

  // Create 06_Practicals/ only if a practical counterpart exists
  const hasPractical = dpharmCourses.some(other => other.year === c.year && other.type === 'Practical' && other.code.substring(5, 7) === c.code.substring(5, 7));
  if (c.type === 'Theory' && hasPractical) {
    const pracDir = path.join(coursePath, '06_Practicals');
    if (!fs.existsSync(pracDir)) fs.mkdirSync(pracDir);
    fs.writeFileSync(path.join(pracDir, 'README.md'), `# Practical Component Mapping\n\nRefer to the corresponding practical course folder in this year.\n`);
  }

  // Co-requisites & Links file
  // Find matching practical course code
  let coreqCode = 'None';
  if (c.type === 'Theory') {
    const matchingPrac = dpharmCourses.find(other => other.year === c.year && other.type === 'Practical' && other.code.substring(5, 7) === c.code.substring(5, 7));
    if (matchingPrac) coreqCode = matchingPrac.code;
  } else if (c.type === 'Practical') {
    const matchingTheory = dpharmCourses.find(other => other.year === c.year && other.type === 'Theory' && other.code.substring(5, 7) === c.code.substring(5, 7));
    if (matchingTheory) coreqCode = matchingTheory.code;
  }

  const linksContent = `# Co-requisites and Links

## Curriculum Status
- **Program**: D.Pharm (ER-2020)
- **Year**: ${c.year}
- **Category**: ${c.category}
- **Credits**: ${c.credits}

## Mapped Relationships
- **Prerequisites**: UNSPECIFIED IN SOURCE
- **Co-requisites**: ${coreqCode !== 'None' ? `[${coreqCode}]` : 'UNSPECIFIED IN SOURCE'}

## Links to Metadata Templates
- [Weekly Study Plan](../../../00_Meta/Weekly_Study_Plan_Template.md)
- [Revision Sheet Template](../../../00_Meta/Revision_Sheet_Template.md)
- [PYQ Tracker Template](../../../00_Meta/PYQ_Tracker_Template.md)
`;
  fs.writeFileSync(path.join(coursePath, '07_Co-requisites-and-Links.md'), linksContent);

  // Master Course README.md
  const readmeContent = `# ${c.code} — ${c.title}

- **Program**: D.Pharm (ER-2020)
- **Year**: ${c.year}
- **Credits**: ${c.credits}
- **Category**: ${c.category}
- **Type**: ${c.type}
- **Notes**: ${c.notes}

## Course Overview
This study folder is organized to match the official PCI D.Pharm ER-2020 curriculum requirements.

## Folder Structure
- \`01_Notes.md\` — General notes and class summaries.
- \`02_Units/\` — Unit-wise chapter breakdowns.
- \`03_PYQ-and-MCQs/\` — Solved papers and question tracker.
- \`04_Mindmaps/\` — Visual flowcharts and diagrams.
- \`05_Revision-Sheets/\` — Formula lists and summary sheets.
${c.type === 'Theory' && hasPractical ? '- `06_Practicals/` — Labs mapping.\n' : ''}- \`07_Co-requisites-and-Links.md\` — Related courses and syllabus links.
`;
  fs.writeFileSync(path.join(coursePath, 'README.md'), readmeContent);
});

console.log('Pharmacy Study Vault generation completed successfully.');
