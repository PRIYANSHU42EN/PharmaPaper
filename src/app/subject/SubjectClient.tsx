"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { supabase, trackPdfView, trackPdfDownload, getSettings } from "../../lib/supabase";
import { useUser } from "@clerk/nextjs";
import InlinePDFViewer from "../../components/InlinePDFViewer";
import PaywallModal from "../../components/PaywallModal";
import VideoCard from "../../components/video/VideoCard";

// Helper to generate highly realistic PCI syllabus units and topics dynamically based on subject name
function getSubjectUnits(subjectName: string) {
  const normalized = subjectName.toLowerCase();

  // 1. Human Anatomy & Physiology
  if (normalized.includes("anatomy") && normalized.includes("physiology")) {
    const isII = normalized.includes("ii");
    return [
      {
        num: "Unit I",
        id: "unit1",
        title: isII ? "Nervous System & Brain Anatomy" : "Introduction to Human Body, Cells & Tissues",
        description: isII 
          ? "Organization of nervous system, neuron structure, action potential, synapse, brain anatomy, spinal cord, and cranial nerves."
          : "Definition and scope of anatomy, cell structure, transport across cell membrane, and classification of epithelial, connective, muscle, and nervous tissues.",
      },
      {
        num: "Unit II",
        id: "unit2",
        title: isII ? "Digestive System & Energetics" : "Skeletal, Integumentary System & Joints",
        description: isII
          ? "Anatomy of GI tract, salivary glands, stomach, liver, pancreas, digestion and absorption of nutrients, and BMR."
          : "Bones of axial and appendicular skeleton, types of joints (fibrous, cartilaginous, synovial), and structure and function of skin.",
      },
      {
        num: "Unit III",
        id: "unit3",
        title: isII ? "Respiratory & Urinary Systems" : "Body Fluids, Blood & Lymphatic System",
        description: isII
          ? "Anatomy of lungs, mechanism of respiration, transport of oxygen and carbon dioxide, and nephron physiology."
          : "Composition and functions of blood, plasma proteins, RBC, WBC, platelets, blood groups, coagulation, and lymph node anatomy.",
      },
      {
        num: "Unit IV",
        id: "unit4",
        title: isII ? "Endocrine System & Hormones" : "Peripheral Nervous System & Special Senses",
        description: isII
          ? "Classification of hormones, mechanism of hormone action, pituitary, thyroid, parathyroid, adrenal, and pineal glands."
          : "Structure and functions of spinal and cranial nerves, autonomic nervous system (sympathetic and parasympathetic), and anatomy of eye, ear, nose, and tongue.",
      },
      {
        num: "Unit V",
        id: "unit5",
        title: isII ? "Reproductive System & Genetics" : "Cardiovascular System & Heart Anatomy",
        description: isII
          ? "Male and female reproductive organs, spermatogenesis, oogenesis, menstrual cycle, pregnancy, and basic genetics."
          : "Anatomy of heart, blood vessels, cardiac cycle, ECG, cardiac output, double circulation, and blood pressure regulation.",
      }
    ];
  }

  // 2. Organic Chemistry
  if (normalized.includes("organic chemistry")) {
    const isII = normalized.includes("ii");
    const isIII = normalized.includes("iii");
    if (isIII) {
      return [
        {
          num: "Unit I",
          id: "unit1",
          title: "Stereoisomerism & Optical Activity",
          description: "Optical isomerism, enantiomers, diastereomers, meso compounds, chiral molecules, racemic modification, and DL/RS nomenclature systems.",
        },
        {
          num: "Unit II",
          id: "unit2",
          title: "Geometrical Isomerism & Conformational Analysis",
          description: "Geometrical isomerism, cis-trans and EZ systems, conformation of ethane, n-butane, and cyclohexane.",
        },
        {
          num: "Unit III",
          id: "unit3",
          title: "Heterocyclic Compounds - Single Heteroatom",
          description: "Nomenclature, synthesis, reactions, and relative basicity of pyrrole, furan, thiophene, and pyridine.",
        },
        {
          num: "Unit IV",
          id: "unit4",
          title: "Heterocyclic Compounds - Multiple Heteroatoms",
          description: "Synthesis, reactions, and medicinal importance of pyrazole, imidazole, oxazole, thiazole, and pyrimidine.",
        },
        {
          num: "Unit V",
          id: "unit5",
          title: "Reactions of Synthetic Importance",
          description: "Metal hydride reductions (NaBH4, LiAlH4), Clemmensen and Wolff-Kishner reductions, Oppenauer oxidation, and Beckmann rearrangement.",
        }
      ];
    } else if (isII) {
      return [
        {
          num: "Unit I",
          id: "unit1",
          title: "Benzene and its Derivatives",
          description: "Structure of benzene, resonance, aromaticity, electrophilic aromatic substitution, orientation and reactivity of substituents.",
        },
        {
          num: "Unit II",
          id: "unit2",
          title: "Phenols and Aromatic Amines",
          description: "Acidity of phenols, synthesis and qualitative chemical tests, basicity of aromatic amines, and diazonium salts.",
        },
        {
          num: "Unit III",
          id: "unit3",
          title: "Fats and Oils",
          description: "Fatty acids, chemical constants (acid value, saponification value, iodine value, acetyl value), and rancidity of oils.",
        },
        {
          num: "Unit IV",
          id: "unit4",
          title: "Polynuclear Hydrocarbons",
          description: "Synthesis, chemical reactions, and derivatives of naphthalene, anthracene, phenanthrene, and diphenylmethane.",
        },
        {
          num: "Unit V",
          id: "unit5",
          title: "Cycloalkanes & Ring Stability",
          description: "Stabilities of cycloalkanes, Baeyer's strain theory, Coulson and Moffitt modification, and Sachse Mohr's theory.",
        }
      ];
    } else {
      return [
        {
          num: "Unit I",
          id: "unit1",
          title: "Classification & Nomenclature of Organic Compounds",
          description: "IUPAC nomenclature rules, structural isomerism, hybridization of carbon, electromeric effects, and reaction intermediates.",
        },
        {
          num: "Unit II",
          id: "unit2",
          title: "Alkanes, Alkenes & Conjugated Dienes",
          description: "SP3 hybridization in alkanes, free radical substitution, stability of alkenes, electrophilic addition (Markovnikov rule), and Diels-Alder reaction.",
        },
        {
          num: "Unit III",
          id: "unit3",
          title: "Alkyl Halides & Nucleophilic Substitution",
          description: "SN1 and SN2 reaction kinetics, mechanisms, stereochemistry, factors affecting nucleophilic substitution, and E1/E2 elimination.",
        },
        {
          num: "Unit IV",
          id: "unit4",
          title: "Carbonyl Compounds (Aldehydes and Ketones)",
          description: "Nucleophilic addition reactions, structure-reactivity relationships, aldol condensation, Cannizzaro reaction, and Benzoin condensation.",
        },
        {
          num: "Unit V",
          id: "unit5",
          title: "Carboxylic Acids and Aliphatic Amines",
          description: "Acidity, factors affecting acidity, qualitative tests, basicity of aliphatic amines, and synthetic utility of esters.",
        }
      ];
    }
  }

  // 2b. Physical Pharmaceutics
  if (normalized.includes("physical pharmaceutics")) {
    const isII = normalized.includes("ii");
    if (isII) {
      return [
        {
          num: "Unit I",
          id: "unit1",
          title: "Colloidal Dispersions",
          description: "Classification of dispersed systems, size/shape of colloidal particles. Comparative properties of colloids. Optical, kinetic, and electrical properties of colloids. Effect of electrolytes, coacervation, peptization, and protective action.",
        },
        {
          num: "Unit II",
          id: "unit2",
          title: "Rheology & Deformation of Solids",
          description: "Newtonian systems, viscosity laws, temperature effects. Non-Newtonian systems: plastic, pseudoplastic, dilatant flow, thixotropy. Determination of viscosity. Plastic/elastic deformation, Heckel equation, stress, strain, elastic modulus.",
        },
        {
          num: "Unit III",
          id: "unit3",
          title: "Coarse Dispersions (Suspensions & Emulsions)",
          description: "Interfacial properties of suspended particles, settling, formulation of flocculated/deflocculated suspensions. Emulsification theories, micro/multiple emulsions. Emulsion stability, preservation, and formulation using HLB method.",
        },
        {
          num: "Unit IV",
          id: "unit4",
          title: "Micromeretics (Particle Technology)",
          description: "Particle size distribution, mean size, number/weight distribution. Methods for determining particle size (microscopy, sieving, sedimentation). Specific surface determination. Derived powder properties: porosity, packing, densities, flow properties.",
        },
        {
          num: "Unit V",
          id: "unit5",
          title: "Drug Stability & Reaction Kinetics",
          description: "Reaction kinetics: zero, pseudo-zero, first, second-order reactions. Determination of reaction order. Physical and chemical factors influencing degradation of pharmaceutical products. Accelerated stability testing and shelf-life calculation.",
        }
      ];
    } else {
      return [
        {
          num: "Unit I",
          id: "unit1",
          title: "Solubility of Drugs",
          description: "Solubility expressions, solute-solvent interactions, ideal solubility, solvation, and association. Factors influencing solubility. Diffusion principles. Solubility of gases in liquids, binary solutions, Raoult's law. CST, Distribution law.",
        },
        {
          num: "Unit II",
          id: "unit2",
          title: "States of Matter & Physical Properties",
          description: "Changes in state of matter, latent heats, vapor pressure, sublimation, critical point. Eutectic mixtures, gases, aerosols, relative humidity. Liquid crystals, glassy state, amorphous solids, polymorphism. Refractive index, dielectric constant, dipole moment.",
        },
        {
          num: "Unit III",
          id: "unit3",
          title: "Surface and Interfacial Phenomenon",
          description: "Liquid interface, surface and interfacial tensions, surface free energy. Measurement methods. Spreading coefficient, adsorption at liquid/solid interfaces, surface-active agents, HLB scale, solubilization, detergency.",
        },
        {
          num: "Unit IV",
          id: "unit4",
          title: "Complexation and Protein Binding",
          description: "Definition, classification of complexes, pharmaceutical applications. Analysis methods. Protein binding of drugs, factors affecting protein-drug complexation, thermodynamic treatment of stability constants.",
        },
        {
          num: "Unit V",
          id: "unit5",
          title: "pH, Buffers and Isotonic Solutions",
          description: "Sorensen's pH scale, electrometric/calorimetric pH determinations. Buffer applications, buffer equation (Henderson-Hasselbalch), buffer capacity, buffers in pharmaceutical/biological systems. Buffered isotonic solutions.",
        }
      ];
    }
  }

  // 3. Pharmaceutics
  if (normalized.includes("pharmaceutics")) {
    return [
      {
        num: "Unit I",
        id: "unit1",
        title: "Historical Background & Prescription Science",
        description: "History of pharmacy profession and pharmacopoeias, prescription parts, handling of prescriptions, and posology calculation formulas.",
      },
      {
        num: "Unit II",
        id: "unit2",
        title: "Pharmaceutical Calculations & Powders",
        description: "Dilution, allegation, proof spirit, powders classification, preparation of dusting powders, effervescent, and hygroscopic powders.",
      },
      {
        num: "Unit III",
        id: "unit3",
        title: "Liquid Dosage Forms & Monophasic Systems",
        description: "Monophasic liquids, solvents used, formulation of wishes, syrups, elixirs, gargles, mouthwashes, throat paints, and douches.",
      },
      {
        num: "Unit IV",
        id: "unit4",
        title: "Biphasic Liquids: Suspensions & Emulsions",
        description: "Suspension formulation, flocculated and deflocculated systems, emulsion types, identification tests, emulsifying agents, and stability issues.",
      },
      {
        num: "Unit V",
        id: "unit5",
        title: "Semisolid Dosage Forms & Suppositories",
        description: "Ointments, creams, pastes, gels, suppository bases, displacement value, and formulation of suppositories.",
      }
    ];
  }

  // 4. Pharmacology
  if (normalized.includes("pharmacology")) {
    const isII = normalized.includes("ii");
    const isIII = normalized.includes("iii");
    if (isIII) {
      return [
        {
          num: "Unit I",
          id: "unit1",
          title: "Pharmacology of Respiratory & Gastrointestinal Systems",
          description: "Drugs for asthma, COPD, expectorants, antitussives, anti-ulcer drugs, antiemetics, laxatives, and purgatives.",
        },
        {
          num: "Unit II",
          id: "unit2",
          title: "Chemotherapy & Antimicrobial Agents",
          description: "General principles of chemotherapy, sulfonamides, cotrimoxazole, penicillins, cephalosporins, and tetracyclines.",
        },
        {
          num: "Unit III",
          id: "unit3",
          title: "Chemotherapy of Specific Diseases",
          description: "Antitubercular, antileprotic, antifungal, antiviral, antimalarial, and anthelmintic agents.",
        },
        {
          num: "Unit IV",
          id: "unit4",
          title: "Cancer Chemotherapy & Immunopharmacology",
          description: "Alkylating agents, antimetabolites, plant alkaloids, immunosuppressants, and immunostimulants.",
        },
        {
          num: "Unit V",
          id: "unit5",
          title: "Toxicology & Biosafety Principles",
          description: "Acute and chronic toxicity, heavy metal poisoning treatment, drug addiction, and drug abuse regulations.",
        }
      ];
    } else if (isII) {
      return [
        {
          num: "Unit I",
          id: "unit1",
          title: "Cardiovascular Pharmacology",
          description: "Hemodynamics, cardiac glycosides, antiarrhythmics, antianginal, antihypertensives, and anti-hyperlipidemic drugs.",
        },
        {
          num: "Unit II",
          id: "unit2",
          title: "Pharmacology of Fluid Balance & Endocrine Systems",
          description: "Diuretics, antidiuretics, pituitary hormones, thyroid, parathyroid, insulin, oral hypoglycemic agents, and antithyroid drugs.",
        },
        {
          num: "Unit III",
          id: "unit3",
          title: "Adrenocorticoids, Androgens & Estrogens",
          description: "Corticosteroids, anabolic steroids, oral contraceptives, drugs acting on uterus, and physiological regulation.",
        },
        {
          num: "Unit IV",
          id: "unit4",
          title: "Autacoids & Anti-inflammatory Agents",
          description: "Histamine, 5-HT, prostaglandins, NSAIDs, antigout drugs, and antihistamines.",
        },
        {
          num: "Unit V",
          id: "unit5",
          title: "Bioassays & Principles",
          description: "Definitions, principles of bioassay, types of bioassays, bioassay of insulin, oxytocin, and d-tubocurarine.",
        }
      ];
    } else {
      return [
        {
          num: "Unit I",
          id: "unit1",
          title: "General Pharmacology & Pharmacokinetics",
          description: "Routes of drug administration, drug absorption, distribution, metabolism, excretion, and transport mechanisms.",
        },
        {
          num: "Unit II",
          id: "unit2",
          title: "General Pharmacology & Pharmacodynamics",
          description: "Mechanism of drug action, receptors, drug-receptor interactions, dose-response relationship, therapeutic index, and adverse drug reactions.",
        },
        {
          num: "Unit III",
          id: "unit3",
          title: "Pharmacology of Autonomic Nervous System",
          description: "Neurohumoral transmission in ANS, parasympathomimetics, parasympatholytics, sympathomimetics, and sympatholytics.",
        },
        {
          num: "Unit IV",
          id: "unit4",
          title: "Pharmacology of Central Nervous System - Sedatives & Anesthetics",
          description: "General anesthetics, sedatives, hypnotics, antiepileptics, alcohols, and disulfiram.",
        },
        {
          num: "Unit V",
          id: "unit5",
          title: "Pharmacology of CNS - Psychopharmacology",
          description: "Antipsychotics, antidepressants, anti-parkinsonian drugs, CNS stimulants, and opioid analgesics.",
        }
      ];
    }
  }

  // 5. Pathophysiology
  if (normalized.includes("pathophysiology")) {
    return [
      {
        num: "Unit I",
        id: "unit1",
        title: "Cell Injury, Adaptation & Inflammation",
        description: "Homeostasis, feedback systems, causes and pathogenesis of cell injury (membrane, mitochondrial, ribosome, and nuclear damage). Cellular adaptations (atrophy, hypertrophy, hyperplasia, metaplasia, dysplasia), cellular swelling, calcification, cell death. Mechanisms of inflammation: vascular changes, WBC migration, mediators, wound healing, and atherosclerosis.",
      },
      {
        num: "Unit II",
        id: "unit2",
        title: "Cardiovascular, Respiratory & Renal Pathophysiology",
        description: "Pathophysiology of Hypertension, Congestive Heart Failure (CHF), Ischemic Heart Disease (Angina, Myocardial Infarction, Arteriosclerosis). Asthma, Chronic Obstructive Pulmonary Disease (COPD). Acute and chronic renal failure.",
      },
      {
        num: "Unit III",
        id: "unit3",
        title: "Haematological, Endocrine, Nervous & GI Systems",
        description: "Anemias: Iron deficiency, megaloblastic, sickle cell, thalassemia, hemophilia. Diabetes Mellitus, thyroid diseases, disorders of sex hormones. Epilepsy, Parkinson's disease, stroke, depression, schizophrenia, Alzheimer's disease. Peptic ulcer disease.",
      },
      {
        num: "Unit IV",
        id: "unit4",
        title: "Liver, Bone, Joint & Oncological Disorders",
        description: "Hepatitis (A, B, C, D, E), jaundice, alcoholic liver disease, inflammatory bowel disease (IBD). Rheumatoid arthritis, osteoporosis, gout. Cancer: classification, etiology, and pathogenesis.",
      },
      {
        num: "Unit V",
        id: "unit5",
        title: "Infectious & Sexually Transmitted Diseases",
        description: "Pathogenesis, signs, symptoms of Meningitis, Typhoid, Leprosy, Tuberculosis, Urinary Tract Infections (UTIs). AIDS, Syphilis, Gonorrhea.",
      }
    ];
  }

  // 6. Biochemistry
  if (normalized.includes("biochemistry")) {
    return [
      {
        num: "Unit I",
        id: "unit1",
        title: "Biomolecules & Bioenergetics",
        description: "Classification, chemical nature, and biological role of carbohydrates, lipids, nucleic acids, amino acids, and proteins. Concept of free energy, endergonic and exergonic reactions, free energy/enthalpy/entropy relationship. Redox potential, ATP and cAMP biological significance.",
      },
      {
        num: "Unit II",
        id: "unit2",
        title: "Carbohydrate Metabolism & Biological Oxidation",
        description: "Glycolysis, Citric acid cycle (TCA), HMP shunt pathways and energetics. Glycogen metabolism, Gluconeogenesis. Blood glucose regulation, Diabetes Mellitus. Electron transport chain (ETC), oxidative phosphorylation, substrate-level phosphorylation, inhibitors, and uncouplers.",
      },
      {
        num: "Unit III",
        id: "unit3",
        title: "Lipid & Amino Acid Metabolism",
        description: "Beta-oxidation of saturated fatty acids (Palmitic acid), ketone bodies, cholesterol synthesis, bile acids, steroid hormones, Vitamin D. Urea cycle, transamination, deamination. Catabolism of phenylalanine, tyrosine, and heme (jaundice). Melatonin, dopamine, adrenaline synthesis.",
      },
      {
        num: "Unit IV",
        id: "unit4",
        title: "Nucleic Acid Metabolism & Genetic Information",
        description: "Biosynthesis of purine and pyrimidine nucleotides, purine catabolism, hyperuricemia (Gout). Structure of DNA and RNA. DNA replication (semiconservative model), transcription, genetic code, translation, and protein synthesis inhibitors.",
      },
      {
        num: "Unit V",
        id: "unit5",
        title: "Enzymes & Coenzymes",
        description: "Properties, nomenclature, and IUB classification of enzymes. Enzyme kinetics (Michaelis-Menten & Lineweaver-Burk plots). Enzyme inhibitors, induction, repression, allosteric regulation. Diagnostic/therapeutic applications. Structure and functions of coenzymes.",
      }
    ];
  }

  // 7. Python Programming for Pharmaceutical Sciences
  if (normalized.includes("python programming")) {
    return [
      {
        num: "Unit I",
        id: "unit1",
        title: "Introduction to Python & Syntax",
        description: "Variables, basic data types (integers, floats, strings, lists, dictionaries), input/output operations, conditional structures (if-elif-else), loops (for, while), and basic syntax rules.",
      },
      {
        num: "Unit II",
        id: "unit2",
        title: "Functions & Core Data Structures",
        description: "Defining and calling functions, parameter passing, return statements, local and global variable scope, file handling basics, and built-in Python module imports.",
      },
      {
        num: "Unit III",
        id: "unit3",
        title: "Data Manipulation (NumPy & Pandas)",
        description: "Multi-dimensional array structures with NumPy. Pandas dataframes, indexing, cleaning missing values, grouping, and transforming formulation and clinical datasets.",
      },
      {
        num: "Unit IV",
        id: "unit4",
        title: "Scientific Data Visualization",
        description: "Creating plots using Matplotlib and Seaborn: line plots, bar charts, scatter plots, histograms of drug dissolution rates, and stability curves.",
      },
      {
        num: "Unit V",
        id: "unit5",
        title: "Practical Scripts & Automation",
        description: "Parsing CSV/Excel sheets, automating dosage calculations, processing molecular structures, and writing scripts to speed up laboratory analytics.",
      }
    ];
  }

  // 8. Machine Learning in Pharmaceutical Sciences
  if (normalized.includes("machine learning")) {
    return [
      {
        num: "Unit I",
        id: "unit1",
        title: "Introduction to Machine Learning",
        description: "Supervised vs unsupervised learning, machine learning workflow, data splitting (train-test-validation), overfitting, and performance evaluation metrics (accuracy, precision, recall, RMSE).",
      },
      {
        num: "Unit II",
        id: "unit2",
        title: "Regression & Predictors (QSAR)",
        description: "Linear and multiple regression models, logistic regression, application in Quantitative Structure-Activity Relationship (QSAR) and prediction of physical properties.",
      },
      {
        num: "Unit III",
        id: "unit3",
        title: "Classification Algorithms",
        description: "Decision Trees, Random Forests, and Support Vector Machines (SVM). Classification of compounds into active vs inactive, toxic vs non-toxic categories.",
      },
      {
        num: "Unit IV",
        id: "unit4",
        title: "Clustering & Unsupervised Learning",
        description: "K-Means clustering, hierarchical clustering, and Principal Component Analysis (PCA) for reducing dimensionality of chemical library spaces.",
      },
      {
        num: "Unit V",
        id: "unit5",
        title: "Neural Networks & Deep Learning",
        description: "Foundations of Artificial Neural Networks (ANN), activation functions, multi-layer perceptron (MLP) architectures, and introduction to molecular generative modeling.",
      }
    ];
  }

  // 9. AI Applications in Pharmaceutical Sciences
  if (normalized.includes("ai applications") || normalized.includes("ai in clinical")) {
    return [
      {
        num: "Unit I",
        id: "unit1",
        title: "AI in Drug Discovery & Screening",
        description: "De novo drug design, virtual screening of chemical databases, prediction of binding affinity, ADMET properties, and generative molecular algorithms.",
      },
      {
        num: "Unit II",
        id: "unit2",
        title: "Computer-Aided Drug Design (CADD)",
        description: "Molecular docking algorithms, target identification, pharmacophore mapping, and quantitative structure-activity relationship (QSAR) workflows.",
      },
      {
        num: "Unit III",
        id: "unit3",
        title: "AI in Clinical Trials & Safety",
        description: "Optimizing trial design, patient cohort selection, adverse drug event monitoring, and processing electronic health records (EHR) using NLP.",
      },
      {
        num: "Unit IV",
        id: "unit4",
        title: "Smart Manufacturing & PAT",
        description: "Excipient optimization, Process Analytical Technology (PAT), predictive maintenance of tablet presses, and real-time monitoring of quality parameters.",
      },
      {
        num: "Unit V",
        id: "unit5",
        title: "Regulatory Compliance & Ethics",
        description: "FDA/EMA regulatory guidelines on AI/ML tools, data privacy (HIPAA/GDPR), algorithmic bias mitigation, and explainable AI (XAI) validation standards.",
      }
    ];
  }

  // 10. Applied Biostatistics and Data Analytics
  if (normalized.includes("applied biostatistics")) {
    return [
      {
        num: "Unit I",
        id: "unit1",
        title: "Descriptive Statistics & Analytics",
        description: "Measures of central tendency (mean, median, mode), measures of dispersion (standard deviation, variance, standard error), and graphical representation of clinical data.",
      },
      {
        num: "Unit II",
        id: "unit2",
        title: "Probability & Distributions",
        description: "Probability concepts, Normal distribution, Binomial distribution, Poisson distribution, and confidence intervals in pharmacology studies.",
      },
      {
        num: "Unit III",
        id: "unit3",
        title: "Parametric Hypothesis Testing",
        description: "Formulation of hypotheses, null and alternative hypothesis, p-values, Student's t-test (paired/unpaired), and Analysis of Variance (one-way and two-way ANOVA) with post-hoc tests.",
      },
      {
        num: "Unit IV",
        id: "unit4",
        title: "Non-Parametric Tests & Regression",
        description: "Chi-square test, Mann-Whitney U test, Wilcoxon signed-rank test. Linear correlation and regression analysis for pharmacokinetic studies.",
      },
      {
        num: "Unit V",
        id: "unit5",
        title: "Statistical Software & Trial Analytics",
        description: "Implementation of calculations using Excel/Python, data cleaning, survival analysis, hazard ratios, and clinical report preparation guidelines.",
      }
    ];
  }

  // Fallback procedural curriculum generator for any subject
  return [
    {
      num: "Unit I",
      id: "unit1",
      title: `Fundamentals of ${subjectName}`,
      description: `Introduction, definitions, historical scope, basic chemical and biological concepts relevant to ${subjectName}, and core theories.`,
    },
    {
      num: "Unit II",
      id: "unit2",
      title: `Physiochemical Principles & Mechanisms`,
      description: `Analysis of mechanisms, physical properties, reaction kinetics, and foundational methodologies matching standardized PCI syllabus guidelines.`,
    },
    {
      num: "Unit III",
      id: "unit3",
      title: `Applied Methodologies & Testing`,
      description: `Qualitative and quantitative characterization, assays, instrumentation parameters, and standard laboratory procedures.`,
    },
    {
      num: "Unit IV",
      id: "unit4",
      title: `Industrial Applications & Formulations`,
      description: `Scaling principles, manufacturing processes, quality control tests, stability protocols, and regulatory requirements.`,
    },
    {
      num: "Unit V",
      id: "unit5",
      title: `Advanced Advances & Novel Research`,
      description: `Latest trends, technology integrations, biotechnology concepts, and clinical/industrial applications in ${subjectName}.`,
    }
  ];
}


function getMockDocContent(
  subjectName: string,
  unitNum: string,
  docType: "notes" | "questions" | "quiz",
  unitTitle: string,
  unitDescription: string
) {
  if (docType === "notes") {
    return [
      `Course Syllabus & Study Notes: ${unitNum} - ${unitTitle}`,
      `Syllabus Overview:\n${unitDescription}`,
      `Key Concept Study Guide:`,
      `1. Fundamental Principles: Under PCI syllabus regulations, the topics listed above represent the baseline requirements for both university examination and professional licensing.`,
      `2. Conceptual Deep-Dive: Students must focus on understanding mechanisms, structural layouts, and practical calculations associated with this unit.`,
      `3. Important Definitions: Ensure you memorize the standard terminology, equations, and classifications provided in the syllabus topics description.`
    ];
  } else if (docType === "questions") {
    return [
      `Important Exam Questions: ${unitNum} - ${unitTitle}`,
      `Part A: Short Answer Questions (2 Marks each)`,
      `1. Define the primary terminology and fundamental mechanisms discussed in ${unitTitle}.`,
      `2. State the key factors influencing the rates, pathways, or attributes of ${unitTitle}.`,
      `3. Explain the relationship between structural characteristics and functional performance within this unit's scope.`,
      `Part B: Long Essay Questions (10 Marks each)`,
      `4. Discuss the detailed pathophysiology, synthesis, or chemical characterization related to ${unitTitle}. Suggest therapeutic interventions or control systems.`,
      `5. Write a comprehensive note on the industrial scales, manufacturing methods, and stability protocols required for this unit's components.`
    ];
  } else {
    return [
      `Mock Assessment: ${unitNum} - ${unitTitle}`,
      `Section A: Multiple Choice Questions (Select the single best answer)`,
      `Q1. Which of the following is the key regulatory body standardizing the curriculum for this subject?\n   A) AICTE\n   B) PCI (Correct)\n   C) UGC\n   D) CSIR`,
      `Q2. What is the primary focus of ${unitTitle}?\n   A) Basic introduction and historical overview\n   B) Advanced theoretical modeling\n   C) Practical industry applications and testing\n   D) All of the above (Correct)`,
      `Section B: Short Assessment Tasks`,
      `Task 1: Briefly differentiate between the major classes of systems described under the syllabus topics.`,
      `Task 2: Describe a standard laboratory assay or quality control protocol relevant to this unit.`
    ];
  }
}

export default function SubjectClient({ initialPremiumStatus }: { initialPremiumStatus: any }) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const subjectName = searchParams.get("name") || "Pharmacy Subject";
  const semId = searchParams.get("sem") || "sem1";
  const typeId = searchParams.get("type") || "bpharm";

  const [completedUnits, setCompletedUnits] = useState<Record<string, boolean>>({});
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  
  // Interactive preview state
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    type: "notes" | "questions" | "quiz";
    unitNum: string;
    content: string[];
  } | null>(null);
  const [isLightMode, setIsLightMode] = useState(false);

  const [dbMaterials, setDbMaterials] = useState<any[]>([]);
  const [dbVideos, setDbVideos] = useState<any[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);
  const [activePdfTitle, setActivePdfTitle] = useState<string>("");
  const [siteName, setSiteName] = useState("Pharma Paper");
  const [isPremium, setIsPremium] = useState<boolean | null>(initialPremiumStatus?.isPremium ?? null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [lockedResourceTitle, setLockedResourceTitle] = useState("");

  useEffect(() => {
    if (isPremium !== null) return;
    fetch("/api/trial/status")
      .then((res) => res.json())
      .then((data) => {
        setIsPremium(data.isPremium);
      })
      .catch((err) => {
        console.error("Failed to check trial status:", err);
        setIsPremium(false);
      });
  }, [isPremium]);

  useEffect(() => {
    getSettings().then((settings) => {
      if (settings?.sitename) {
        setSiteName(settings.sitename);
      }
    });
  }, []);

  const renderLogo = (name: string) => {
    const parts = name.split(" ");
    if (parts.length <= 1) {
      return <span>{name.toUpperCase()}</span>;
    }
    return (
      <>
        {parts[0].toUpperCase()}
        <span className="text-brand"> {parts.slice(1).join(" ").toUpperCase()}</span>
      </>
    );
  };

  // URL validation to prevent XSS (CWE-79)
  const validateUrl = (urlStr: string): boolean => {
    if (!urlStr) return false;
    try {
      const url = new URL(urlStr);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return false;
      }
      return true;
    } catch (e) {
      return urlStr.startsWith("/");
    }
  };

  // Fetch materials and videos from Supabase
  useEffect(() => {
    async function fetchMaterials() {
      try {
        setLoadingDb(true);
        const courseDbName = typeId === "bpharm" ? "B.Pharm" : "D.Pharm";
        const semesterDbVal = parseInt(semId.replace("sem", "").replace("year", ""), 10) || 1;

        const { data, error } = await supabase
          .from("study_materials")
          .select("id, title, semester, course, type, subject, created_at")
          .eq("semester", semesterDbVal);
        
        if (error) throw error;
        
        const filtered = (data || []).filter(item => {
          const itemCourse = (item.course || "").toLowerCase();
          const targetCourse = courseDbName.toLowerCase();
          
          const itemSubject = (item.subject || "").toLowerCase();
          const targetSubject = subjectName.toLowerCase();
          
          const courseMatch = itemCourse.includes(targetCourse) || targetCourse.includes(itemCourse);
          const subjectMatch = itemSubject === targetSubject || itemSubject.includes(targetSubject) || targetSubject.includes(itemSubject);
          
          return courseMatch && subjectMatch;
        });

        setDbMaterials(filtered);

        // Fetch videos matching the subject
        const { data: videosData, error: videosError } = await supabase
          .from("videos")
          .select(`
            *,
            lecturer:lecturers (
              id,
              name,
              avatar_url
            )
          `)
          .eq("subject", subjectName)
          .eq("is_published", true);
        
        if (!videosError && videosData) {
          setDbVideos(videosData);
        }
      } catch (err) {
        console.error("Error fetching study materials from Supabase:", err);
      } finally {
        setLoadingDb(false);
      }
    }
    fetchMaterials();
  }, [subjectName, semId, typeId]);

  // GSAP ScrollTrigger for Video cards inside units
  useEffect(() => {
    if (dbVideos.length === 0) return;
    if (typeof window !== "undefined") {
      const { gsap } = require("gsap");
      const { ScrollTrigger } = require("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      gsap.fromTo(
        ".subject-video-card-animate",
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#units-list-container",
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );
    }
  }, [dbVideos]);

  // Helper to filter materials for a specific unit
  const getUnitMaterials = (unitNum: string) => {
    const romanToNum: Record<string, string> = {
      "Unit I": "unit 1",
      "Unit II": "unit 2",
      "Unit III": "unit 3",
      "Unit IV": "unit 4",
      "Unit V": "unit 5",
    };
    const targetUnit = unitNum.toLowerCase();
    const targetNumStr = romanToNum[unitNum] || "";
    
    return dbMaterials.filter(item => {
      const itemTitle = (item.title || "").toLowerCase();
      return itemTitle.includes(targetUnit) || (targetNumStr && itemTitle.includes(targetNumStr));
    });
  };

  const getUnitVideos = (unitNum: string) => {
    const romanToNumVal: Record<string, number> = {
      "Unit I": 1,
      "Unit II": 2,
      "Unit III": 3,
      "Unit IV": 4,
      "Unit V": 5,
    };
    const targetUnitInt = romanToNumVal[unitNum] || 1;
    return dbVideos.filter(v => v.unit === targetUnitInt);
  };

  const getUnitDbPdf = (unitNum: string) => {
    const materials = getUnitMaterials(unitNum);
    return materials.find(m => m.type === "pdf" || m.type === "notes") || null;
  };

  const getUnitDbResource = (unitNum: string, type: "questions" | "quiz") => {
    const materials = getUnitMaterials(unitNum);
    return materials.find(m => m.type === type) || null;
  };

  // Load checkboxes from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem(`progress_${subjectName}`);
    if (saved) {
      try {
        setCompletedUnits(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, [subjectName]);

  const toggleUnitComplete = (unitNum: string) => {
    const updated = {
      ...completedUnits,
      [unitNum]: !completedUnits[unitNum]
    };
    setCompletedUnits(updated);
    localStorage.setItem(`progress_${subjectName}`, JSON.stringify(updated));
  };

  const units = useMemo(() => {
    return getSubjectUnits(subjectName);
  }, [subjectName]);

  const completionPercentage = useMemo(() => {
    const completedCount = Object.values(completedUnits).filter(Boolean).length;
    return Math.round((completedCount / units.length) * 100);
  }, [completedUnits, units]);

  const checkDocumentAccess = async (urlOrId: string, title: string) => {
    try {
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(urlOrId);
      const queryParam = isUuid ? `id=${urlOrId}` : `url=${encodeURIComponent(urlOrId)}`;
      const checkRes = await fetch(`/api/pdf-proxy?check=true&${queryParam}&title=${encodeURIComponent(title)}`);
      if (checkRes.ok) {
        return true;
      }
      const errData = await checkRes.json();
      if (errData.error === "limit_reached") {
        setLockedResourceTitle(title);
        setIsPaywallOpen(true);
      } else {
        alert(errData.error || "Access denied.");
      }
      return false;
    } catch (err) {
      console.error("Error checking document access:", err);
      alert("Failed to check access limits.");
      return false;
    }
  };

  const handleDownload = async (unitNum: string, docType: "notes" | "questions" | "quiz", unitTitle: string, unitDescription: string) => {
    const mockUrl = `mock://${subjectName}/${unitNum}/${docType}`;
    const mockTitle = `${unitNum} ${docType === "notes" ? "Study Notes" : docType === "questions" ? "Important Questions" : "Mock Assessment"}`;
    
    const hasAccess = await checkDocumentAccess(mockUrl, mockTitle);
    if (!hasAccess) return;

    const fileId = `${subjectName}_${unitNum}_${docType}`;
    setDownloadingFile(fileId);
    
    trackPdfView(`mock://${subjectName}/${unitNum}/${docType}`, `${unitNum}: ${unitTitle}`, user?.id || null);

    setTimeout(() => {
      setDownloadingFile(null);
      const content = getMockDocContent(subjectName, unitNum, docType, unitTitle, unitDescription);
      setPreviewDoc({
        title: `${unitNum}: ${unitTitle}`,
        type: docType,
        unitNum: unitNum,
        content: content
      });
    }, 800);
  };

  const triggerLocalDownload = (doc: { title: string; type: string; unitNum: string; content: string[] }) => {
    trackPdfDownload(`mock://${subjectName}/${doc.unitNum}/${doc.type}`, doc.title, user?.id || null);

    const header = `========================================
${subjectName} - ${doc.unitNum}
RESOURCE: ${doc.type.toUpperCase()} - ${doc.title}
PCI Syllabus Standardized Study Guide
========================================`;
    const footer = `----------------------------------------
Generated dynamically on Pharma Paper. Distraction-Free Study Vault.`;
    const fullText = [header, ...doc.content, footer].join("\n\n");
    const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${subjectName.replace(/\s+/g, "_")}_${doc.unitNum.replace(/\s+/g, "_")}_${doc.type}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative w-full min-h-screen bg-brand-charcoal text-brand-cream selection:bg-brand selection:text-white pb-16">
      {/* Decorative background glows */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] ambient-brand-glow pointer-events-none opacity-[0.06]" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] ambient-brand-glow pointer-events-none opacity-[0.03]" />

      {/* Navigation Header */}
      <header className="sticky top-0 w-full h-16 glass-panel border-b border-brand-border flex items-center justify-between px-6 md:px-12 z-50 backdrop-blur-md bg-brand-charcoal/80">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand shadow-[0_0_8px_rgba(142,146,144,0.8)] animate-pulse" />
          <span className="font-bebas text-xl tracking-wider text-brand-cream font-bold">
            {renderLogo(siteName)}
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link href={`/notes?sem=${semId}&type=${typeId}`} className="px-4 py-1.5 rounded-full border border-brand-border hover:border-brand/40 hover:text-brand text-xs font-semibold tracking-wider uppercase transition-all duration-300">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 pt-8">
        
        {/* Subject Header Banner */}
        <div className="p-8 glass-panel border border-brand-border rounded-3xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="absolute -right-24 -top-24 w-64 h-64 bg-brand/5 filter blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-brand font-mono uppercase tracking-widest font-bold">
                {typeId === "bpharm" ? "B. Pharmacy Notes" : "D. Pharmacy Notes"}
              </span>
              <span className="text-brand-cream/30 text-xs">•</span>
              <span className="text-[10px] text-brand-cream/60 font-mono uppercase tracking-widest font-semibold">
                {semId.toUpperCase()}
              </span>
            </div>
            <h1 className="font-bebas text-4xl md:text-6xl text-brand-cream uppercase tracking-wide leading-none mb-4">
              {subjectName}
            </h1>
            <p className="text-xs text-brand-cream/55 max-w-xl leading-relaxed">
              Complete unit-wise study notes, syllabus guidelines, and lecture references matching the Pharmacy Council of India guidelines.
            </p>
          </div>

          {/* Progress Tracker widget */}
          <div className="flex flex-col gap-2 p-6 rounded-2xl bg-brand-charcoal/50 border border-brand-border min-w-[200px] shrink-0">
            <span className="text-[10px] text-brand-cream/40 uppercase tracking-widest font-mono">
              Study Progress Tracker
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bebas text-brand">{completionPercentage}%</span>
              <span className="text-xs text-brand-cream/50">Completed</span>
            </div>
            <div className="w-full bg-brand-border h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className="bg-brand h-full transition-all duration-500 ease-out" 
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content Section Layout with Sticky Sidebar Index */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Floating Index Menu */}
          <aside className="lg:col-span-3 lg:sticky lg:top-24 flex flex-col gap-4">
            <div className="p-5 glass-panel border border-brand-border rounded-2xl">
              <h3 className="text-[10px] text-brand-cream/40 uppercase tracking-widest font-bold mb-4">
                Syllabus Units Index
              </h3>
              <nav className="flex flex-col gap-2">
                {units.map((unit) => (
                  <a
                    key={unit.num}
                    href={`#${unit.id}`}
                    className="flex items-center justify-between text-xs font-semibold py-2 px-3 rounded-lg hover:bg-brand/5 hover:text-brand transition-all group"
                  >
                    <span className="text-brand-cream/70 group-hover:text-brand uppercase">
                      {unit.num}
                    </span>
                    <span className="text-[9px] text-brand-cream/40 font-mono tracking-wider ml-2 max-w-[120px] truncate text-right">
                      {unit.title}
                    </span>
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Right Column: Unit-by-Unit Vertical List */}
          <section id="units-list-container" className="lg:col-span-9 flex flex-col gap-12">
            {/* Supabase Repository Materials Section */}
            {dbMaterials.length > 0 && (
              <div className="p-6 glass-panel border border-brand/30 bg-brand/[0.01] rounded-2xl flex flex-col gap-4">
                <div>
                  <span className="text-[10px] text-brand uppercase font-mono tracking-widest font-bold">
                    Connected Study Vault (Supabase)
                  </span>
                  <h3 className="font-bebas text-2xl text-brand-cream uppercase tracking-wide leading-none mt-1">
                    Database Assets Found ({dbMaterials.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dbMaterials.map((material) => (
                    <div 
                      key={material.id}
                      className="p-4 rounded-xl bg-brand-charcoal/50 border border-brand-border flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <span className="text-[8px] font-mono uppercase tracking-widest text-brand font-bold">
                          {material.type || "Resource"}
                        </span>
                        <h4 className="text-xs font-bold text-brand-cream truncate mt-0.5" title={material.title}>
                          {material.title}
                        </h4>
                      </div>
                      <button
                        onClick={async () => {
                          const hasAccess = await checkDocumentAccess(material.id, material.title || "Study Material");
                          if (hasAccess) {
                            trackPdfView(material.id, material.title || "Study Material", user?.id || null);
                            setActivePdfUrl(material.id);
                            setActivePdfTitle(material.title || "Study Material");
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-brand/10 hover:bg-brand border border-brand/20 text-brand hover:text-brand-charcoal text-[10px] font-bold uppercase tracking-wider transition-all shrink-0"
                      >
                        Open
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {units.map((unit) => (
              <div
                key={unit.num}
                id={unit.id}
                className="p-6 md:p-8 glass-panel border border-brand-border rounded-2xl flex flex-col gap-6 relative"
              >
                {/* Unit Header Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-border/40 pb-4 gap-4">
                  <div>
                    <span className="text-[10px] text-brand uppercase font-mono tracking-widest font-bold">
                      PCI Syllabus Curriculum
                    </span>
                    <h2 className="font-bebas text-3xl md:text-4xl text-brand-cream uppercase tracking-wide leading-none mt-1">
                      {unit.num}: {unit.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleUnitComplete(unit.num)}
                      className={`px-4 py-2 rounded-full border text-[10px] font-bold tracking-widest uppercase transition-all duration-300 ${
                        completedUnits[unit.num]
                          ? "bg-brand/10 border-brand text-brand"
                          : "border-brand-border hover:border-brand/40 text-brand-cream/60 hover:text-brand-cream"
                      }`}
                    >
                      {completedUnits[unit.num] ? "✓ Marked Complete" : "Mark as Complete"}
                    </button>
                  </div>
                </div>

                {/* Syllabus Text Topics */}
                <div>
                  <h3 className="text-[10px] text-brand-cream/40 uppercase tracking-widest font-semibold mb-2">
                    Syllabus Topics Covered
                  </h3>
                  <p className="text-xs text-brand-cream/80 leading-relaxed font-medium bg-brand-charcoal/40 p-4 border border-brand-border rounded-xl">
                    {unit.description}
                  </p>
                </div>

                {/* Handwritten PDF Notes Preview Container */}
                <div>
                  <h3 className="text-[10px] text-brand-cream/40 uppercase tracking-widest font-semibold mb-3">
                    Handwritten PDF Preview
                  </h3>
                  <div className="relative border border-brand-border rounded-xl overflow-hidden aspect-[4/3] max-w-lg bg-brand-charcoal flex items-center justify-center group shadow-xl">
                    <img
                      src="/handwritten_notes_preview.png"
                      alt={`${unit.num} Handwritten Notes Preview`}
                      className="w-full h-full object-cover opacity-60 group-hover:scale-[1.02] transition-transform duration-500 select-none pointer-events-none"
                    />
                    
                    {/* Watermark overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal via-transparent to-brand-charcoal/30" />
                    
                    <div className="absolute top-4 left-4 px-3 py-1 rounded bg-brand-charcoal/80 border border-brand-border text-[9px] font-mono uppercase tracking-widest text-brand-cream/60 select-none">
                      Page 1 Preview
                    </div>

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-full px-4">
                      {getUnitDbPdf(unit.num) ? (
                        <button
                          onClick={async () => {
                            const pdf = getUnitDbPdf(unit.num);
                            if (pdf) {
                              const hasAccess = await checkDocumentAccess(pdf.id, pdf.title || `${unit.num} Study Notes`);
                              if (hasAccess) {
                                trackPdfView(pdf.id, pdf.title || `${unit.num} Study Notes`, user?.id || null);
                                setActivePdfUrl(pdf.id);
                                setActivePdfTitle(pdf.title || `${unit.num} Study Notes`);
                              }
                            }
                          }}
                          className="px-6 py-2.5 rounded-full bg-brand hover:bg-brand-dark text-brand-charcoal font-semibold text-xs tracking-wider uppercase transition-all duration-300 shadow-[0_4px_20px_rgba(142,146,144,0.4)] w-auto max-w-[90%] truncate"
                        >
                          View PDF Notes
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDownload(unit.num, "notes", unit.title, unit.description)}
                          disabled={downloadingFile !== null}
                          className="px-6 py-2.5 rounded-full bg-brand hover:bg-brand-dark text-brand-charcoal font-semibold text-xs tracking-wider uppercase transition-all duration-300 shadow-[0_4px_20px_rgba(142,146,144,0.4)]"
                        >
                          {downloadingFile === `${subjectName}_${unit.num}_notes` ? "Preparing Preview..." : "View Notes PDF (Mock)"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Native Video Lectures */}
                {getUnitVideos(unit.num).length > 0 && (
                  <div className="border-t border-brand-border/20 pt-4">
                    <h4 className="text-[10px] text-brand-cream/40 uppercase tracking-widest font-semibold mb-3">
                      Video Lectures ({getUnitVideos(unit.num).length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {getUnitVideos(unit.num).map((video) => (
                        <div key={video.id} className="subject-video-card-animate">
                          <VideoCard
                            video={video}
                            hasVideoAccess={!!isPremium}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Study resources button links */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {getUnitDbResource(unit.num, "questions") ? (
                    <button
                      onClick={async () => {
                        const res = getUnitDbResource(unit.num, "questions");
                        if (res) {
                          const hasAccess = await checkDocumentAccess(res.id, res.title || `${unit.num} Questions`);
                          if (hasAccess) {
                            trackPdfView(res.id, res.title || `${unit.num} Questions`, user?.id || null);
                            setActivePdfUrl(res.id);
                            setActivePdfTitle(res.title || `${unit.num} Questions`);
                          }
                        }
                      }}
                      className="py-3 px-4 rounded-xl text-center text-xs font-semibold uppercase tracking-wider border border-brand/40 bg-brand/5 text-brand hover:bg-brand hover:text-brand-charcoal transition-all"
                    >
                      ❓ Questions (DB)
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDownload(unit.num, "questions", unit.title, unit.description)}
                      className="py-3 px-4 rounded-xl text-center text-xs font-semibold uppercase tracking-wider border border-brand-border hover:border-brand/30 text-brand-cream/80 hover:text-brand transition-all"
                    >
                      ❓ Important Questions
                    </button>
                  )}

                  {getUnitDbResource(unit.num, "quiz") ? (
                    <button
                      onClick={async () => {
                        const res = getUnitDbResource(unit.num, "quiz");
                        if (res) {
                          const hasAccess = await checkDocumentAccess(res.id, res.title || `${unit.num} Mock Assessment`);
                          if (hasAccess) {
                            trackPdfView(res.id, res.title || `${unit.num} Mock Assessment`, user?.id || null);
                            setActivePdfUrl(res.id);
                            setActivePdfTitle(res.title || `${unit.num} Mock Assessment`);
                          }
                        }
                      }}
                      className="py-3 px-4 rounded-xl text-center text-xs font-semibold uppercase tracking-wider border border-brand/40 bg-brand/5 text-brand hover:bg-brand hover:text-brand-charcoal transition-all"
                    >
                      📜 Mock Quiz (DB)
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDownload(unit.num, "quiz", unit.title, unit.description)}
                      className="py-3 px-4 rounded-xl text-center text-xs font-semibold uppercase tracking-wider border border-brand-border hover:border-brand/30 text-brand-cream/80 hover:text-brand transition-all"
                    >
                      📜 Unit Mock Assessment
                    </button>
                  )}

                  <a
                    href={`https://youtube.com/results?search_query=Carewell+Pharma+${encodeURIComponent(subjectName)}+${encodeURIComponent(unit.num)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-4 rounded-xl text-center text-xs font-semibold uppercase tracking-wider border border-brand-border hover:border-brand/30 text-brand hover:bg-brand hover:text-brand-charcoal transition-all"
                  >
                    🎥 Video Lecture
                  </a>
                </div>
              </div>
            ))}
          </section>

        </div>

      </main>

      {/* Interactive document viewer modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-brand-charcoal/90 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8 overflow-y-auto">
          <div className={`w-full max-w-4xl rounded-2xl border border-brand-border overflow-hidden shadow-2xl transition-colors duration-300 ${
            isLightMode ? "bg-[#fcfbf9] text-gray-900" : "bg-[#181818] text-brand-cream"
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-charcoal/40 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase font-mono tracking-widest font-bold px-2.5 py-1 rounded bg-brand/15 text-brand border border-brand/20">
                  {previewDoc.type.toUpperCase()} PREVIEW
                </span>
                <h3 className="font-bebas text-lg md:text-xl tracking-wider text-brand-cream uppercase">
                  {subjectName} — {previewDoc.unitNum}
                </h3>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Light/Dark Toggle */}
                <button
                  onClick={() => setIsLightMode(!isLightMode)}
                  className="p-2 rounded-lg border border-brand-border text-xs hover:border-brand text-brand-cream transition-all uppercase font-semibold tracking-wider"
                >
                  {isLightMode ? "🌙 Dark Mode" : "☀️ Light Mode"}
                </button>
                
                <button
                  onClick={() => triggerLocalDownload(previewDoc)}
                  className="px-4 py-2 bg-brand hover:bg-brand-dark text-brand-charcoal rounded-lg font-bold text-xs uppercase tracking-wider transition-all"
                >
                  ⬇️ Save File
                </button>
                
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 rounded-lg border border-brand-border hover:border-red-500 hover:text-red-500 text-brand-cream text-xs transition-all"
                >
                  ✕ Close
                </button>
              </div>
            </div>
            
            {/* Paper/Doc Content Page */}
            <div className="p-8 max-h-[70vh] overflow-y-auto font-sans leading-relaxed select-text selection:bg-brand selection:text-white">
              <div className="max-w-2xl mx-auto flex flex-col gap-6">
                <h2 className={`font-bebas text-3xl md:text-4xl border-b pb-4 tracking-wide uppercase ${
                  isLightMode ? "border-gray-200 text-gray-900" : "border-brand-border text-brand-cream"
                }`}>
                  {previewDoc.title}
                </h2>
                
                {previewDoc.content.map((paragraph, index) => (
                  <p key={index} className={`text-sm whitespace-pre-wrap ${
                    isLightMode ? "text-gray-700 font-medium" : "text-brand-cream/80"
                  }`}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activePdfUrl && (
        <div className="fixed inset-0 bg-brand-charcoal/95 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8">
          <InlinePDFViewer
            pdfUrl={activePdfUrl}
            title={activePdfTitle}
            onClose={() => setActivePdfUrl(null)}
          />
        </div>
      )}

      {/* Paywall Gate Modal */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        resourceTitle={lockedResourceTitle}
      />
    </div>
  );
}

// SubjectClient component is default exported above.
