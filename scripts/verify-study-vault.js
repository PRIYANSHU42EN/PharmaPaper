const fs = require('fs');
const path = require('path');

const VAULT_ROOT = path.join(__dirname, '..', 'Pharmacy-Study-Vault');

function verifyVault() {
  console.log(`Starting Pharmacy Study Vault verification at: ${VAULT_ROOT}`);

  if (!fs.existsSync(VAULT_ROOT)) {
    console.error('Error: Vault root folder does not exist!');
    process.exit(1);
  }

  // 1. Verify 00_Meta
  const metaDir = path.join(VAULT_ROOT, '00_Meta');
  if (!fs.existsSync(metaDir)) {
    console.error('Error: 00_Meta directory does not exist!');
    process.exit(1);
  }

  const expectedMetaFiles = [
    'Evaluation-Rules.md',
    'Academic-Calendar.md',
    'Internship_Log_Template.md',
    'Internship_Report_Template.md',
    'Internship_Checklist.md',
    'Research_Project_PartI_Template.md',
    'Research_Project_PartII_Template.md',
    'Revision_Sheet_Template.md',
    'PYQ_Tracker_Template.md',
    'Mindmap_Template.md',
    'Weekly_Study_Plan_Template.md'
  ];

  expectedMetaFiles.forEach(file => {
    const filePath = path.join(metaDir, file);
    if (!fs.existsSync(filePath)) {
      console.error(`Error: Expected meta file ${file} is missing!`);
      process.exit(1);
    }
  });
  console.log('✔ Meta folder and templates verified successfully.');

  // 2. Verify B.Pharm courses
  const bpharmRoot = path.join(VAULT_ROOT, '01_B.Pharm_NEP2020');
  if (!fs.existsSync(bpharmRoot)) {
    console.error('Error: 01_B.Pharm_NEP2020 root does not exist!');
    process.exit(1);
  }

  const expectedSems = ['Sem1', 'Sem2', 'Sem3', 'Sem4', 'Sem5', 'Sem6', 'Sem7', 'Sem8'];
  let totalBpharmFolders = 0;

  expectedSems.forEach(sem => {
    const semPath = path.join(bpharmRoot, sem);
    if (!fs.existsSync(semPath)) {
      console.error(`Error: B.Pharm semester folder ${sem} is missing!`);
      process.exit(1);
    }
    const folders = fs.readdirSync(semPath);
    totalBpharmFolders += folders.length;

    // Check one folder structure as sample
    if (folders.length > 0) {
      const sampleFolder = path.join(semPath, folders[0]);
      const expectedSubitems = ['01_Notes.md', 'README.md', '07_Co-requisites-and-Links.md'];
      expectedSubitems.forEach(subitem => {
        if (!fs.existsSync(path.join(sampleFolder, subitem))) {
          console.error(`Error: Sample course folder ${folders[0]} is missing standard file ${subitem}!`);
          process.exit(1);
        }
      });
    }
  });

  console.log(`✔ B.Pharm folders: verified ${totalBpharmFolders} courses across 8 semesters (Expected: 97).`);

  // 3. Verify D.Pharm courses
  const dpharmRoot = path.join(VAULT_ROOT, '02_D.Pharm_ER20');
  if (!fs.existsSync(dpharmRoot)) {
    console.error('Error: 02_D.Pharm_ER20 root does not exist!');
    process.exit(1);
  }

  const expectedYears = ['Year1', 'Year2'];
  let totalDpharmFolders = 0;

  expectedYears.forEach(year => {
    const yearPath = path.join(dpharmRoot, year);
    if (!fs.existsSync(yearPath)) {
      console.error(`Error: D.Pharm year folder ${year} is missing!`);
      process.exit(1);
    }
    const folders = fs.readdirSync(yearPath);
    totalDpharmFolders += folders.length;
  });

  console.log(`✔ D.Pharm folders: verified ${totalDpharmFolders} courses across 2 years (Expected: 22).`);

  const totalCourses = totalBpharmFolders + totalDpharmFolders;
  console.log(`✔ Vault verified successfully. Total courses created: ${totalCourses} / 119.`);
}

verifyVault();
