const addMember =
  'INSERT INTO members (id, identity_number, fullname, customer_id, barcode, birth_date, phone_number, is_active, address, email, instagram, facebook, twitter, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())';

const getMembers = 'SELECT * FROM members';
const getMemberById = 'SELECT * FROM members WHERE id = $1';
const getMemberByCustomerId = 'SELECT * FROM members WHERE customer_id = $1';
const getMemberByIdentityNumber = 'SELECT * FROM members WHERE identity_number = $1';
const deleteMemberById = 'DELETE FROM members WHERE id = $1';
const updateMemberByCustomerId =
  'UPDATE members SET fullname = $1, barcode = $2, birth_date = $3, phone_number = $4, is_active = $5, address = $6, email = $7, instagram = $8, facebook = $9, twitter = $10, updated_at = NOW() WHERE customer_id = $11';
const updateMemberByIdentityNumber =
  'UPDATE members SET fullname = $1, barcode = $2, birth_date = $3, phone_number = $4, is_active = $5, address = $6, email = $7, instagram = $8, facebook = $9, twitter = $10, updated_at = NOW() WHERE identity_number = $11';

module.exports = {
  addMember,
  getMembers,
  getMemberById,
  getMemberByCustomerId,
  getMemberByIdentityNumber,
  deleteMemberById,
  updateMemberByCustomerId,
  updateMemberByIdentityNumber,
};
