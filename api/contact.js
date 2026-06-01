module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, phone, email, dealership, state, showName, showTag } = req.body || {};

  if (!email && !phone) {
    return res.status(400).json({ error: 'Email or phone required' });
  }

  const apiKey = process.env.GHL_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const tags = ['source-show', 'list-newsletter'];
  if (showTag) tags.push(showTag);

  const contact = {
    firstName: firstName || '',
    lastName: lastName || '',
    email: email || '',
    phone: formatPhone(phone || ''),
    companyName: dealership || '',
    state: (state || '').toUpperCase().slice(0, 2),
    tags,
    source: showName ? `Show — ${showName}` : 'Show',
  };

  // Strip empty strings so GHL doesn't overwrite existing data with blanks
  Object.keys(contact).forEach(k => {
    if (contact[k] === '') delete contact[k];
  });

  const LOCATION_ID = 'FQd58sTNzZ8jUMdFYMWK';

  try {
    const ghlRes = await fetch('https://services.leadconnectorhq.com/contacts/upsert', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Version: '2021-07-28',
      },
      body: JSON.stringify({ ...contact, locationId: LOCATION_ID }),
    });

    if (!ghlRes.ok) {
      const body = await ghlRes.text();
      console.error('GHL error', ghlRes.status, body);
      return res.status(502).json({ error: 'GHL error', status: ghlRes.status });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(500).json({ error: 'Network error' });
  }
};

function formatPhone(p) {
  const digits = p.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === '1') return `+${digits}`;
  return p;
}
