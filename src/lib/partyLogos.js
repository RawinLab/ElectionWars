/**
 * Party Logo Mapping - 52 Parties from allparty.md
 * Maps party ballot numbers to ECT official logo files
 * Source: docs/informations/allparty.md
 * Logos: Election Commission of Thailand (ECT) https://party.ect.go.th/party-info
 */

// Party ballot number (เบอร์พรรค) -> ECT logo file mapping
const partyLogos = {
  1: '/logos/ect/156-ไทยทรัพย์ทวี.jpg',           // พรรคไทยทรัพย์ทวี
  2: '/logos/ect/074-เพื่อชาติไทย.jpg',           // พรรคเพื่อชาติไทย
  3: '/logos/ect/146-ใหม่.jpg',                   // พรรคใหม่
  4: '/logos/ect/131-มิติใหม่.jpg',               // พรรคมิติใหม่
  5: '/logos/ect/152-รวมใจไทย.jpg',               // พรรครวมใจไทย
  6: '/logos/ect/130-รวมไทยสร้างชาติ.jpg',        // พรรครวมไทยสร้างชาติ
  7: '/logos/ect/119-พลวัต.jpg',                  // พรรคพลวัต
  8: '/logos/ect/024-ประชาธิปไตยใหม่.jpg',        // พรรคประชาธิปไตยใหม่
  9: '/logos/ect/008-เพื่อไทย.jpg',               // พรรคเพื่อไทย
  10: '/logos/ect/059-ทางเลือกใหม่.jpg',          // พรรคทางเลือกใหม่
  11: '/logos/ect/062-เศรษฐกิจ.png',              // พรรคเศรษฐกิจ
  12: '/logos/ect/038-เสรีรวมไทย.jpg',            // พรรคเสรีรวมไทย
  13: '/logos/ect/157-รวมพลังประชาชน.jpg',        // พรรครวมพลังประชาชน
  14: '/logos/ect/144-ท้องที่ไทย.jpg',            // พรรคท้องที่ไทย
  15: '/logos/ect/013-อนาคตไทย.jpg',              // พรรคอนาคตไทย
  16: '/logos/ect/093-พลังเพื่อไทย.jpg',          // พรรคพลังเพื่อไทย
  17: '/logos/ect/139-ไทยชนะ.jpg',                // พรรคไทยชนะ
  18: '/logos/ect/128-พลังสังคมใหม่.jpg',         // พรรคพลังสังคมใหม่
  19: '/logos/ect/017-สังคมประชาธิปไตยไทย.jpg',   // พรรคสังคมประชาธิปไตยไทย
  20: '/logos/ect/126-ฟิวชัน.jpg',                // พรรคฟิวชัน
  21: '/logos/ect/140-ไทรวมพลัง.jpg',             // พรรคไทยรวมพลัง
  22: '/logos/ect/075-ก้าวอิสระ.jpg',             // พรรคก้าวอิสระ
  23: '/logos/ect/073-ปวงชนไทย.jpg',              // พรรคปวงชนไทย
  24: '/logos/ect/087-พลังสังคม.png',             // พรรควินัยไทย (using similar)
  25: '/logos/ect/048-เพื่อชีวิตใหม่.jpg',        // พรรคเพื่อชีวิตใหม่
  26: '/logos/ect/078-คลองไทย.jpg',               // พรรคคลองไทย
  27: '/logos/ect/001-ประชาธิปัตย์.jpg',          // พรรคประชาธิปัตย์
  28: '/logos/ect/148-ไทยก้าวหน้า.jpg',           // พรรคไทยก้าวหน้า
  29: '/logos/ect/136-ไทยภักดี.png',              // พรรคไทยภักดี
  30: '/logos/ect/147-แรงงานสร้างชาติ.jpg',       // พรรคแรงงานสร้างชาติ
  31: '/logos/ect/002-ประชากรไทย.jpg',            // พรรคประชากรไทย
  32: '/logos/ect/028-ครูไทยเพื่อประชาชน.jpg',    // พรรคครูไทยเพื่อประชาชน
  33: '/logos/ect/076-ประชาชาติ.png',             // พรรคประชาชาติ
  34: '/logos/ect/063-สร้างอนาคตไทย.jpg',         // พรรคสร้างอนาคตไทย
  35: '/logos/ect/021-รักชาติ.jpg',               // พรรครักชาติ
  36: '/logos/ect/072-ไทยพร้อม.jpg',              // พรรคไทยพร้อม
  37: '/logos/ect/015-ภูมิใจไทย.jpg',             // พรรคภูมิใจไทย
  38: '/logos/ect/064-พลังธรรมใหม่.jpg',          // พรรคพลังธรรมใหม่
  39: '/logos/ect/095-กรีน.jpg',                  // พรรคกรีน
  40: '/logos/ect/067-ไทยธรรม.jpg',               // พรรคไทยธรรม
  41: '/logos/ect/077-แผ่นดินธรรม.jpg',           // พรรคแผ่นดินธรรม
  42: '/logos/ect/121-กล้าธรรม.jpg',              // พรรคกล้าธรรม
  43: '/logos/ect/081-พลังประชารัฐ.jpg',          // พรรคพลังประชารัฐ
  44: '/logos/ect/143-โอกาสใหม่.jpg',             // พรรคโอกาสไทย (using similar)
  45: '/logos/ect/092-เป็นธรรม.jpg',              // พรรคเป็นธรรม
  46: '/logos/ect/032-ประชาชน.png',               // พรรคประชาชน
  47: '/logos/ect/094-ประชาไทย.jpg',              // พรรคประชาไทย
  48: '/logos/ect/129-ไทยสร้างไทย.png',           // พรรคไทยสร้างไทย
  49: '/logos/ect/033-ไทยก้าวใหม่.jpg',           // พรรคไทยก้าวใหม่
  50: '/logos/ect/155-ประชาอาสาชาติ.jpg',         // พรรคประชาอาสาชาติ
  51: '/logos/ect/025-พลังบูรพา.jpg',             // พรรคพลัง (using similar)
  52: '/logos/ect/007-เครือข่ายชาวนาแห่งประเทศไทย.jpg', // พรรคเครือข่ายชาวนาแห่งประเทศไทย
}

/**
 * Get logo URL for a party by ballot number
 * @param {number} ballotNumber - The party ballot number (เบอร์พรรค)
 * @returns {string|null} - Logo URL or null if no logo available
 */
export function getPartyLogo(ballotNumber) {
  return partyLogos[ballotNumber] || null
}

/**
 * Check if party has a logo
 * @param {number} ballotNumber - The party ballot number
 * @returns {boolean} - True if party has a logo
 */
export function hasPartyLogo(ballotNumber) {
  return ballotNumber in partyLogos
}

/**
 * Get all available party logos
 * @returns {Object} - Map of ballot number to logo URL
 */
export function getAllPartyLogos() {
  return { ...partyLogos }
}

export default partyLogos
