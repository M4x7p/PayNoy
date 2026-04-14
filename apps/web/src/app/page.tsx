import Image from "next/image";

/* =============== SVG ICONS (inlined for performance) =============== */
const IconBolt = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
);
const IconShield = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
);
const IconChart = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
);
const IconQR = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 18h.01M18 14h.01" /></svg>
);
const IconBell = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>
);
const IconCheck = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>
);
const IconX = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" opacity="0.3"><path d="M18 6L6 18M6 6l12 12" /></svg>
);
const IconArrowRight = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
);
const IconStar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
);
const IconLock = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
);

/* =============== PAGE =============== */
export default function Home() {
  return (
    <>
      {/* ============ NAVBAR ============ */}
      <nav className="navbar glass" id="navbar">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <a href="#" className="flex items-center gap-2 text-xl font-extrabold tracking-tight no-underline" style={{ color: 'var(--text-primary)' }}>
            <span style={{ fontSize: '1.5rem' }}>💸</span>
            <span>Pay<span className="gradient-text">Noy</span></span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium no-underline" style={{ color: 'var(--text-secondary)' }}>ฟีเจอร์</a>
            <a href="#pricing" className="text-sm font-medium no-underline" style={{ color: 'var(--text-secondary)' }}>ราคา</a>
            <a href="#demo" className="text-sm font-medium no-underline" style={{ color: 'var(--text-secondary)' }}>ตัวอย่าง</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="#auth" className="btn-secondary text-sm" style={{ padding: '10px 20px' }}>เข้าสู่ระบบ</a>
            <a href="#cta" className="btn-primary text-sm" style={{ padding: '10px 20px' }}>เริ่มใช้ฟรี</a>
          </div>
        </div>
      </nav>

      {/* ============ SECTION 1: HERO ============ */}
      <section className="hero-bg" style={{ paddingTop: '140px', paddingBottom: '80px' }}>
        <div className="dot-pattern" />
        <div className="section relative" style={{ zIndex: 2, paddingTop: 0 }}>
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left: Copy */}
            <div className="flex-1 text-center lg:text-left">
              <div className="trust-badge mb-6 animate-fade-in">
                <IconStar />
                <span>ใช้งานจริงโดย 500+ Discord Servers</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6 animate-fade-in-up" style={{ letterSpacing: '-0.03em' }}>
                รับเงินผ่าน Discord<br />
                <span className="gradient-text">อัตโนมัติ ด้วย QR เดียว</span>
              </h1>
              <p className="text-lg md:text-xl mb-8 animate-fade-in-up delay-100" style={{ color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto 2rem', textAlign: 'inherit' }}>
                ลูกค้าโอน → แจ้งเตือนทันที<br className="hidden md:block" />
                ไม่ต้องเช็คสลิปเองอีก
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up delay-200">
                <a href="#cta" className="btn-primary" style={{ fontSize: '1.1rem', padding: '18px 40px' }}>
                  เริ่มใช้ฟรี 7 วัน
                  <IconArrowRight />
                </a>
                <a href="#pricing" className="btn-secondary" style={{ fontSize: '1rem', padding: '16px 32px' }}>
                  ⚡ รับสิทธิ์ทดลอง 14 วัน
                </a>
              </div>
              <p className="text-sm mt-4 animate-fade-in-up delay-300" style={{ color: 'var(--text-muted)' }}>
                ไม่ต้องใส่บัตรเครดิต · ยกเลิกได้ตลอด · เริ่มได้ใน 2 นาที
              </p>
            </div>

            {/* Right: Product Preview */}
            <div className="flex-1 w-full max-w-lg animate-fade-in-up delay-300">
              <div className="relative">
                {/* Dashboard Preview */}
                <div className="mockup-wrapper animate-float">
                  <Image
                    src="/dashboard-preview.png"
                    alt="PayNoy Dashboard แสดงยอดชำระเงินรายวัน"
                    width={600}
                    height={400}
                    className="w-full"
                    priority
                  />
                </div>
                {/* Discord Notification Overlay */}
                <div className="absolute -bottom-8 -left-8 w-[280px] md:w-[320px] mockup-wrapper" style={{ animation: 'float 5s ease-in-out infinite', animationDelay: '1.5s', zIndex: 10 }}>
                  <Image
                    src="/discord-notification.png"
                    alt="Discord แจ้งเตือนการชำระเงินสำเร็จ"
                    width={320}
                    height={200}
                    className="w-full"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ============ SECTION 2: PAIN AMPLIFICATION ============ */}
      <section style={{ background: 'var(--bg-secondary)' }}>
        <div className="section">
          <div className="text-center mb-16">
            <h2 className="section-title">
              คุณยังทำแบบนี้อยู่หรือเปล่า? 😩
            </h2>
            <p className="section-subtitle mx-auto">
              ถ้าคุณเจอปัญหาเหล่านี้แม้แต่ข้อเดียว — คุณกำลังเสียเงินทุกวัน
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { emoji: '😤', title: 'นั่งเช็คสลิปทุกวัน', desc: 'เปิดแอปธนาคาร สลับไปมา เทียบยอดเอง กว่าจะเสร็จก็หมดวัน' },
              { emoji: '😶', title: 'ลูกค้าโอนแล้วไม่แจ้ง', desc: 'โอนเงินแล้วหายเงียบ ต้องมานั่งถามทีละคน เสียเวลาเสียอารมณ์' },
              { emoji: '🚨', title: 'เสี่ยงโดนสลิปปลอม', desc: 'แก้ไขสลิปง่ายมาก ถ้าไม่เช็คทุกรายการ อาจเสียเงินโดยไม่รู้ตัว' },
              { emoji: '🔁', title: 'ตอบแชทซ้ำวนไป', desc: '"โอนยังคะ?" "ได้รับเงินแล้วนะ" — ข้อความเดิมๆ ทุกวัน ทุกออเดอร์' },
            ].map((item, i) => (
              <div key={i} className="card flex items-start gap-5" style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="text-4xl flex-shrink-0">{item.emoji}</span>
                <div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-xl font-bold" style={{ color: 'var(--danger)' }}>
              ⏱️ ทุกนาทีที่เสียไปกับงานเหล่านี้ = เงินที่หายไป
            </p>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ============ SECTION 3: SOLUTION (3 Steps) ============ */}
      <section>
        <div className="section">
          <div className="text-center mb-16">
            <h2 className="section-title">
              แค่ <span className="gradient-text">3 ขั้นตอน</span> ก็พร้อมรับเงิน
            </h2>
            <p className="section-subtitle mx-auto">
              ไม่ต้องเขียนโค้ด ไม่ต้องตั้งค่าอะไรยุ่งยาก เริ่มได้ทันที
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'สร้าง QR ของคุณ', desc: 'เชื่อมบัญชีธนาคาร สร้าง QR Code พร้อมใช้งานบน Discord Server ของคุณ', icon: <IconQR /> },
              { step: '2', title: 'ลูกค้าโอนเงิน', desc: 'ลูกค้าสแกน QR — ระบบตรวจจับการโอนเงินแบบ Real-time ผ่าน Omise API', icon: <IconBolt /> },
              { step: '3', title: 'แจ้งเตือนอัตโนมัติ', desc: 'ได้เงินปุ๊บ แจ้งเข้า Discord ปั๊บ พร้อมมอบยศให้ลูกค้าอัตโนมัติ', icon: <IconBell /> },
            ].map((item, i) => (
              <div key={i} className="flex-1 text-center card" style={{ padding: '40px 28px' }}>
                <div className="step-number mx-auto mb-6">{item.step}</div>
                <div className="feature-icon mx-auto mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Outcome highlights */}
          <div className="flex flex-wrap justify-center gap-6 mt-16">
            {[
              { value: '80%', label: 'ลดเวลาจัดการ' },
              { value: '0', label: 'สลิปที่ต้องเช็คเอง' },
              { value: '24/7', label: 'รับเงินอัตโนมัติ' },
            ].map((stat, i) => (
              <div key={i} className="text-center px-8 py-6 card" style={{ minWidth: '180px' }}>
                <div className="text-3xl font-extrabold gradient-text mb-1">{stat.value}</div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ============ SECTION 4: DEMO / VISUAL ============ */}
      <section id="demo" style={{ background: 'var(--bg-secondary)' }}>
        <div className="section">
          <div className="text-center mb-16">
            <h2 className="section-title">
              ดูจริง <span className="gradient-text">ใช้งานจริง</span>
            </h2>
            <p className="section-subtitle mx-auto">
              ไม่ใช่ภาพสวยๆ แต่เป็นระบบที่ทำงานจริง รับเงินจริง
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
            {/* Discord Notification */}
            <div>
              <div className="mockup-wrapper mb-6">
                <Image
                  src="/discord-notification.png"
                  alt="ตัวอย่างแจ้งเตือนใน Discord เมื่อได้รับเงิน"
                  width={500}
                  height={300}
                  className="w-full"
                />
              </div>
              <h3 className="text-lg font-bold mb-2">🔔 แจ้งเตือน Discord ทันที</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                เมื่อลูกค้าชำระเงินสำเร็จ ระบบจะส่งข้อความเข้า Channel ที่คุณตั้งไว้ทันที
                พร้อมรายละเอียดยอดเงิน ชื่อลูกค้า และสินค้า
              </p>
            </div>

            {/* Dashboard */}
            <div>
              <div className="mockup-wrapper mb-6">
                <Image
                  src="/dashboard-preview.png"
                  alt="Dashboard ยอดรายได้รายวันและรายเดือน"
                  width={500}
                  height={300}
                  className="w-full"
                />
              </div>
              <h3 className="text-lg font-bold mb-2">📊 Dashboard จัดการครบ</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                ดูยอดรายได้รายวัน / รายเดือน ติดตามสถานะทุกออเดอร์
                ดูได้จากทุกอุปกรณ์ ทุกที่ ทุกเวลา
              </p>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ============ SECTION 5: FEATURES ============ */}
      <section id="features">
        <div className="section">
          <div className="text-center mb-16">
            <h2 className="section-title">
              ทำไมต้อง <span className="gradient-text">PayNoy</span>?
            </h2>
            <p className="section-subtitle mx-auto">
              ทุกฟีเจอร์ออกแบบมาเพื่อให้คุณ "ทำเงิน" ได้มากขึ้น โดย "ทำงาน" น้อยลง
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: <IconBell />, title: 'แจ้งเตือน Real-time', desc: 'ได้เงินปุ๊บ รู้ปั๊บ แจ้งเตือนเข้า Discord ทันทีไม่ต้องรอ' },
              { icon: <IconChart />, title: 'Dashboard ติดตามยอด', desc: 'ดูรายได้รายวัน รายเดือน สถิติครบ จัดการง่ายในจอเดียว' },
              { icon: <IconQR />, title: 'หลาย QR รองรับได้', desc: 'สร้าง QR ได้หลายตัว แยกตามสินค้า แยกตามเซิร์ฟเวอร์' },
              { icon: <IconShield />, title: 'ตรวจสอบสลิปปลอม', desc: 'ระบบตรวจจับอัตโนมัติ ไม่ต้องเช็คเองอีก ปิดช่องมิจฉาชีพ' },
              { icon: <IconBolt />, title: 'ตั้งค่าง่าย ไม่ต้องเขียนโค้ด', desc: 'แค่เชื่อม Discord Bot กรอกข้อมูลบัญชี เสร็จใน 2 นาที' },
              { icon: <IconLock />, title: 'ปลอดภัย มาตรฐานสากล', desc: 'เข้ารหัสข้อมูลทุกจุด ผ่าน Omise Payment Gateway ที่ได้ PCI-DSS' },
            ].map((feat, i) => (
              <div key={i} className="card" style={{ padding: '28px' }}>
                <div className="feature-icon mb-4">{feat.icon}</div>
                <h3 className="text-base font-bold mb-2">{feat.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ============ SECTION 6: PRICING ============ */}
      <section id="pricing" style={{ background: 'var(--bg-secondary)' }}>
        <div className="section">
          <div className="text-center mb-16">
            <h2 className="section-title">
              ราคาที่ <span className="gradient-text">คุ้มค่าที่สุด</span>
            </h2>
            <p className="section-subtitle mx-auto">
              เริ่มฟรี ไม่มีค่าแรกเข้า อัปเกรดได้ทุกเมื่อ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            {/* FREE */}
            <div className="card flex flex-col">
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-1">Free</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>เริ่มต้นใช้งาน</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-extrabold">฿0</span>
                <span className="text-sm ml-1" style={{ color: 'var(--text-muted)' }}>/เดือน</span>
              </div>
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {[
                  { ok: true, text: '1 QR Code' },
                  { ok: true, text: 'แจ้งเตือน Discord' },
                  { ok: false, text: 'Dashboard' },
                  { ok: false, text: 'ตรวจสอบสลิปปลอม' },
                  { ok: false, text: 'Multi-Server' },
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm" style={{ color: f.ok ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {f.ok ? <span style={{ color: 'var(--success)' }}><IconCheck /></span> : <IconX />}
                    {f.text}
                  </li>
                ))}
              </ul>
              <a href="#cta" className="btn-secondary w-full text-center">เริ่มใช้ฟรี</a>
            </div>

            {/* PRO — Featured */}
            <div className="card-featured flex flex-col" style={{ transform: 'scale(1.04)' }}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold mb-1">Pro</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>แนะนำสำหรับคนขายจริง</p>
                </div>
                <span className="pricing-badge">Best Value</span>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-extrabold gradient-text">฿99</span>
                <span className="text-sm ml-1" style={{ color: 'var(--text-muted)' }}>/เดือน</span>
              </div>
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {[
                  'QR ไม่จำกัด',
                  'Dashboard ยอดรายได้',
                  'แจ้งเตือน Discord Real-time',
                  'ตรวจสอบสลิปปลอม',
                  'มอบยศ Role อัตโนมัติ',
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span style={{ color: 'var(--success)' }}><IconCheck /></span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="#cta" className="btn-primary w-full text-center" style={{ padding: '16px 24px' }}>
                เริ่มใช้ Pro ฟรี 7 วัน
              </a>
            </div>

            {/* BUSINESS */}
            <div className="card flex flex-col">
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-1">Business</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>สำหรับทีมและธุรกิจ</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-extrabold">฿299</span>
                <span className="text-sm ml-1" style={{ color: 'var(--text-muted)' }}>/เดือน</span>
              </div>
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {[
                  'ทุกอย่างใน Pro',
                  'หลายผู้ใช้ / Admin',
                  'Advanced Dashboard',
                  'API & Export ข้อมูล',
                  'ตรวจสอบสลิปขั้นสูง',
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span style={{ color: 'var(--success)' }}><IconCheck /></span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="#cta" className="btn-secondary w-full text-center">ติดต่อเรา</a>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ============ SECTION 7: URGENCY ============ */}
      <section className="urgency-stripe">
        <div className="section text-center" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ background: 'rgba(250, 166, 26, 0.1)', border: '1px solid rgba(250, 166, 26, 0.2)', color: 'var(--warning)', fontSize: '0.85rem', fontWeight: 700 }}>
            ⏰ จำนวนจำกัด — เฉพาะช่วงเปิดตัว
          </div>
          <h2 className="section-title mb-4">
            ทดลองใช้ฟรี <span className="gradient-text">7 วัน</span>
          </h2>
          <p className="text-lg mb-3" style={{ color: 'var(--text-secondary)' }}>
            หรือรับสิทธิ์ <strong style={{ color: 'var(--warning)' }}>ทดลอง 14 วัน</strong> สำหรับผู้ใช้ช่วงเปิดตัว
          </p>
          <p className="text-sm mb-10" style={{ color: 'var(--text-muted)' }}>
            ไม่ต้องใส่บัตรเครดิต · ยกเลิกได้ทุกเมื่อ · ไม่มีค่าใช้จ่ายแอบแฝง
          </p>
          <a href="#cta" className="btn-primary" style={{ fontSize: '1.15rem', padding: '20px 48px' }}>
            รับสิทธิ์ 14 วัน ตอนนี้
            <IconArrowRight />
          </a>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ============ SECTION 8: FINAL CTA ============ */}
      <section id="cta" className="hero-bg" style={{ position: 'relative' }}>
        <div className="dot-pattern" />
        <div className="section text-center relative" style={{ zIndex: 2, paddingTop: '100px', paddingBottom: '100px' }}>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6" style={{ letterSpacing: '-0.03em' }}>
            เริ่มใช้ฟรี<span className="gradient-text">ตอนนี้</span>
          </h2>
          <p className="text-lg mb-10 mx-auto" style={{ color: 'var(--text-secondary)', maxWidth: '480px' }}>
            เปลี่ยนจาก &quot;นั่งเช็คสลิปเอง&quot; เป็น &quot;ระบบจัดการให้อัตโนมัติ&quot; ภายใน 2 นาที
          </p>
          <a href="#auth" className="btn-primary animate-pulse-glow" style={{ fontSize: '1.2rem', padding: '20px 56px' }}>
            สมัครใช้งานฟรี
            <IconArrowRight />
          </a>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ============ SECTION 9: AUTH ============ */}
      <section id="auth" style={{ background: 'var(--bg-secondary)' }}>
        <div className="section" style={{ maxWidth: '480px' }}>
          <div className="card-featured" style={{ padding: '40px' }}>
            <div className="text-center mb-8">
              <span className="text-3xl mb-4 block">💸</span>
              <h2 className="text-2xl font-extrabold mb-2">เข้าสู่ระบบ PayNoy</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>เริ่มใช้งานด้วยบัญชี Discord ของคุณ</p>
            </div>
            <a
              href="/api/auth/signin"
              className="btn-primary w-full text-center mb-4"
              style={{ padding: '16px', background: '#5865f2', position: 'relative' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
              </svg>
              เข้าสู่ระบบด้วย Discord
            </a>
            <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              ยังไม่มีบัญชี? ระบบจะสร้างให้อัตโนมัติเมื่อเข้าสู่ระบบครั้งแรก
            </p>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ============ SECTION 10: TRUST ============ */}
      <section>
        <div className="section text-center" style={{ paddingTop: '80px', paddingBottom: '60px' }}>
          <h2 className="text-2xl font-bold mb-10">
            ปลอดภัย · <span className="gradient-text">ใช้งานจริง</span> · เชื่อถือได้
          </h2>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {[
              '🏦 กสิกรไทย',
              '🏦 กรุงเทพ',
              '🏦 ไทยพาณิชย์',
              '🏦 กรุงศรี',
              '🏦 ทหารไทยธนชาต',
              '🏦 PromptPay',
            ].map((bank, i) => (
              <div key={i} className="px-5 py-3 rounded-full text-sm font-medium" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                {bank}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="trust-badge"><IconShield /> เข้ารหัส SSL/TLS</div>
            <div className="trust-badge"><IconLock /> PCI-DSS Compliant</div>
            <div className="trust-badge"><IconCheck /> ใช้งานจริง 500+ เซิร์ฟเวอร์</div>
          </div>

          <div className="card inline-block" style={{ padding: '20px 32px' }}>
            <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>ชื่อผู้รับเงิน (แสดงบนหน้าสลิป)</p>
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              นาย *** พ****น
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              ข้อมูลผ่านการยืนยันตัวตนแล้ว ✅
            </p>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
        <div className="section" style={{ padding: '40px 24px' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">💸</span>
              <span className="font-bold">Pay<span className="gradient-text">Noy</span></span>
            </div>
            <div className="flex gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
              <a href="#features" className="no-underline hover:underline" style={{ color: 'inherit' }}>ฟีเจอร์</a>
              <a href="#pricing" className="no-underline hover:underline" style={{ color: 'inherit' }}>ราคา</a>
              <a href="#demo" className="no-underline hover:underline" style={{ color: 'inherit' }}>ตัวอย่าง</a>
              <a href="#auth" className="no-underline hover:underline" style={{ color: 'inherit' }}>เข้าสู่ระบบ</a>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              © 2026 PayNoy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
