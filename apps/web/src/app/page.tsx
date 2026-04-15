import Image from "next/image";

/* =============== SVG ICONS =============== */
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
          <a href="#" className="flex items-center gap-2.5 no-underline" style={{ color: 'var(--text-primary)' }}>
            <span style={{ fontSize: '1.6rem' }}>💸</span>
            <span className="text-xl font-bold tracking-tight">
              เปย์หน่อย
              <span className="text-xs font-normal ml-1.5" style={{ color: 'var(--text-muted)', letterSpacing: '0.02em' }}>PayNoi</span>
            </span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium no-underline" style={{ color: 'var(--text-secondary)' }}>ฟีเจอร์</a>
            <a href="#pricing" className="text-sm font-medium no-underline" style={{ color: 'var(--text-secondary)' }}>ราคา</a>
            <a href="#demo" className="text-sm font-medium no-underline" style={{ color: 'var(--text-secondary)' }}>ตัวอย่าง</a>
            <a href="#faq" className="text-sm font-medium no-underline" style={{ color: 'var(--text-secondary)' }}>คำถามที่พบบ่อย</a>
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

              <h1 className="text-4xl md:text-5xl lg:text-6xl leading-tight mb-6 animate-fade-in-up">
                ระบบรับเงิน QR อัตโนมัติ<br />
                <span className="gradient-text">แจ้งเตือน Discord ทันที</span>
              </h1>

              <p className="text-lg md:text-xl mb-8 animate-fade-in-up delay-100" style={{ color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: '540px', margin: '0 auto 2rem', textAlign: 'inherit' }}>
                <strong style={{ color: 'var(--text-primary)' }}>เปย์หน่อย</strong> — ลูกค้าโอนเงินผ่าน QR → ระบบตรวจสอบสลิปอัตโนมัติ → แจ้งเตือนเข้า Discord ทันที ไม่ต้องเช็คสลิปเองอีก
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up delay-200">
                <a href="#cta" className="btn-primary" style={{ fontSize: '1.1rem', padding: '18px 40px' }}>
                  เริ่มใช้ฟรี 7 วัน
                  <IconArrowRight />
                </a>
                <a href="#pricing" className="btn-secondary" style={{ fontSize: '1rem', padding: '16px 32px' }}>
                  ⚡ ทดลองใช้ฟรี 14 วัน (ช่วงเปิดตัว)
                </a>
              </div>

              <p className="text-sm mt-4 animate-fade-in-up delay-300" style={{ color: 'var(--text-muted)' }}>
                ไม่ต้องใส่บัตรเครดิต · ยกเลิกได้ตลอด · เริ่มได้ใน 2 นาที
              </p>
            </div>

            {/* Right: Product Preview */}
            <div className="flex-1 w-full max-w-lg animate-fade-in-up delay-300">
              <div className="relative">
                <div className="mockup-wrapper animate-float">
                  <Image
                    src="/dashboard-preview.png"
                    alt="เปย์หน่อย Dashboard ระบบรับเงิน QR แสดงยอดชำระเงินรายวัน"
                    width={600}
                    height={400}
                    className="w-full"
                    priority
                  />
                </div>
                <div className="absolute -bottom-8 -left-8 w-[280px] md:w-[320px] mockup-wrapper" style={{ animation: 'float 5s ease-in-out infinite', animationDelay: '1.5s', zIndex: 10 }}>
                  <Image
                    src="/discord-notification.png"
                    alt="ระบบแจ้งเตือนการโอนเงินผ่าน Discord อัตโนมัติ"
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

      {/* ============ SECTION 2: PAIN ============ */}
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
              { emoji: '🚨', title: 'เสี่ยงโดนสลิปปลอม', desc: 'แก้ไขสลิปง่ายมาก ถ้าไม่ใช้ระบบตรวจสอบสลิป อาจเสียเงินโดยไม่รู้ตัว' },
              { emoji: '🔁', title: 'ตอบแชทซ้ำวนไป', desc: '"โอนยังคะ?" "ได้รับเงินแล้วนะ" — ข้อความเดิมๆ ทุกวัน ทุกออเดอร์' },
            ].map((item, i) => (
              <div key={i} className="card flex items-start gap-5">
                <span className="text-4xl flex-shrink-0">{item.emoji}</span>
                <div>
                  <h3 className="text-lg mb-2">{item.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-xl font-semibold" style={{ color: 'var(--danger)' }}>
              ⏱️ ทุกนาทีที่เสียไปกับงานเหล่านี้ = เงินที่หายไป
            </p>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ============ SECTION 3: SOLUTION ============ */}
      <section>
        <div className="section">
          <div className="text-center mb-16">
            <h2 className="section-title">
              แค่ <span className="gradient-text">3 ขั้นตอน</span> ก็พร้อมรับเงินอัตโนมัติ
            </h2>
            <p className="section-subtitle mx-auto">
              ใช้เปย์หน่อยได้ทันที ไม่ต้องเขียนโค้ด ไม่ต้องตั้งค่าอะไรยุ่งยาก
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'สร้าง QR ของคุณ', desc: 'เชื่อมบัญชีธนาคาร สร้าง QR Code พร้อมใช้งานบน Discord Server ของคุณ', icon: <IconQR /> },
              { step: '2', title: 'ลูกค้าโอนเงิน', desc: 'ลูกค้าสแกน QR ชำระเงิน — ระบบตรวจสอบสลิปอัตโนมัติผ่าน Omise API', icon: <IconBolt /> },
              { step: '3', title: 'แจ้งเตือน Discord ทันที', desc: 'ได้เงินปุ๊บ แจ้งเข้า Discord ปั๊บ พร้อมมอบยศให้ลูกค้าอัตโนมัติ', icon: <IconBell /> },
            ].map((item, i) => (
              <div key={i} className="flex-1 text-center card" style={{ padding: '40px 28px' }}>
                <div className="step-number mx-auto mb-6">{item.step}</div>
                <div className="feature-icon mx-auto mb-4">{item.icon}</div>
                <h3 className="text-xl mb-3">{item.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-16">
            {[
              { value: '80%', label: 'ลดเวลาจัดการ' },
              { value: '0', label: 'สลิปที่ต้องเช็คเอง' },
              { value: '24/7', label: 'รับเงินอัตโนมัติ' },
            ].map((stat, i) => (
              <div key={i} className="text-center px-8 py-6 card" style={{ minWidth: '180px' }}>
                <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ============ SECTION 4: DEMO ============ */}
      <section id="demo" style={{ background: 'var(--bg-secondary)' }}>
        <div className="section">
          <div className="text-center mb-16">
            <h2 className="section-title">
              ดูจริง <span className="gradient-text">ใช้งานจริง</span>
            </h2>
            <p className="section-subtitle mx-auto">
              ไม่ใช่ภาพสวยๆ แต่เป็นระบบรับเงิน QR ที่ทำงานจริง รับเงินจริง
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
            <div>
              <div className="mockup-wrapper mb-6">
                <Image
                  src="/discord-notification.png"
                  alt="ระบบแจ้งเตือนการโอนเงินเข้า Discord ของเปย์หน่อย"
                  width={500}
                  height={300}
                  className="w-full"
                  loading="lazy"
                />
              </div>
              <h3 className="text-lg mb-2">🔔 ระบบแจ้งเตือน Discord อัตโนมัติ</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                เมื่อลูกค้าชำระเงินสำเร็จ ระบบแจ้งเตือนการโอนเงินเข้า Channel ที่คุณตั้งไว้ทันที
                พร้อมรายละเอียดยอดเงิน ชื่อลูกค้า และสินค้า
              </p>
            </div>

            <div>
              <div className="mockup-wrapper mb-6">
                <Image
                  src="/dashboard-preview.png"
                  alt="Dashboard ยอดรายได้รายวันและรายเดือนของเปย์หน่อย"
                  width={500}
                  height={300}
                  className="w-full"
                  loading="lazy"
                />
              </div>
              <h3 className="text-lg mb-2">📊 Dashboard ติดตามยอดรายได้</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                ดูยอดรายได้รายวัน / รายเดือน ติดตามสถานะทุกออเดอร์
                จัดการได้จากทุกอุปกรณ์ ทุกที่ ทุกเวลา
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
              ทำไมต้อง <span className="gradient-text">เปย์หน่อย</span>?
            </h2>
            <p className="section-subtitle mx-auto">
              ฟีเจอร์ที่ออกแบบมาเพื่อให้คุณ &quot;รับเงินอัตโนมัติ&quot; ได้มากขึ้น โดย &quot;ทำงาน&quot; น้อยลง
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: <IconBell />, title: 'แจ้งเตือน Discord Real-time', desc: 'ระบบแจ้งเตือนการโอนเงินเข้า Discord ทันที ไม่ต้องรอ ไม่ต้องตรวจสอบเอง' },
              { icon: <IconChart />, title: 'Dashboard ติดตามยอด', desc: 'ดูยอดรายได้รายวัน รายเดือน สถิติครบ จัดการง่ายในจอเดียว' },
              { icon: <IconQR />, title: 'รองรับหลาย QR Code', desc: 'สร้าง QR payment ไทยได้หลายตัว แยกตามสินค้า แยกตามเซิร์ฟเวอร์' },
              { icon: <IconShield />, title: 'ระบบตรวจสอบสลิปปลอม', desc: 'ตรวจสอบสลิปอัตโนมัติผ่าน Payment Gateway ไม่ต้องเช็คเอง ปิดช่องมิจฉาชีพ' },
              { icon: <IconBolt />, title: 'ตั้งค่าง่าย ไม่ต้องเขียนโค้ด', desc: 'แค่เชิญบอทเข้า Discord กรอกข้อมูลบัญชี เสร็จใน 2 นาที' },
              { icon: <IconLock />, title: 'ปลอดภัย มาตรฐานสากล', desc: 'เข้ารหัสข้อมูลทุกจุด ผ่าน Omise Payment Gateway ที่ได้ PCI-DSS' },
            ].map((feat, i) => (
              <div key={i} className="card" style={{ padding: '28px' }}>
                <div className="feature-icon mb-4">{feat.icon}</div>
                <h3 className="text-base mb-2">{feat.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>{feat.desc}</p>
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
                <h3 className="text-lg mb-1">Free</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>เริ่มต้นใช้งาน</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-bold">฿0</span>
                <span className="text-sm ml-1" style={{ color: 'var(--text-muted)' }}>/เดือน</span>
              </div>
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {[
                  { ok: true, text: '1 QR Code' },
                  { ok: true, text: 'แจ้งเตือน Discord' },
                  { ok: false, text: 'Dashboard' },
                  { ok: false, text: 'ระบบตรวจสอบสลิปปลอม' },
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
                  <h3 className="text-lg mb-1">Pro</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>แนะนำสำหรับคนขายจริง</p>
                </div>
                <span className="pricing-badge">Best Value</span>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-bold gradient-text">฿99</span>
                <span className="text-sm ml-1" style={{ color: 'var(--text-muted)' }}>/เดือน</span>
              </div>
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {[
                  'QR Code ไม่จำกัด',
                  'Dashboard ยอดรายได้',
                  'ระบบแจ้งเตือน Discord Real-time',
                  'ระบบตรวจสอบสลิปปลอม',
                  'มอบยศ Role อัตโนมัติ',
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span style={{ color: 'var(--success)' }}><IconCheck /></span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="#cta" className="btn-primary w-full text-center" style={{ padding: '16px 24px' }}>
                เริ่มใช้ฟรี 7 วัน
              </a>
            </div>

            {/* BUSINESS */}
            <div className="card flex flex-col">
              <div className="mb-8">
                <h3 className="text-lg mb-1">Business</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>สำหรับทีมและธุรกิจ</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-bold">฿299</span>
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ background: 'rgba(250, 166, 26, 0.1)', border: '1px solid rgba(250, 166, 26, 0.2)', color: 'var(--warning)', fontSize: '0.85rem', fontWeight: 600 }}>
            ⏰ จำนวนจำกัด — เฉพาะช่วงเปิดตัว
          </div>
          <h2 className="section-title mb-4">
            ทดลองใช้ฟรี <span className="gradient-text">7 วัน</span>
          </h2>
          <p className="text-lg mb-3" style={{ color: 'var(--text-secondary)' }}>
            หรือรับสิทธิ์ <strong style={{ color: 'var(--warning)' }}>ทดลองใช้ฟรี 14 วัน</strong> สำหรับผู้ใช้ช่วงเปิดตัว
          </p>
          <p className="text-sm mb-10" style={{ color: 'var(--text-muted)' }}>
            ไม่ต้องใส่บัตรเครดิต · ยกเลิกได้ทุกเมื่อ · ไม่มีค่าใช้จ่ายแอบแฝง
          </p>
          <a href="#cta" className="btn-primary" style={{ fontSize: '1.15rem', padding: '20px 48px' }}>
            ทดลองใช้ฟรี พร้อมสิทธิ์ 14 วัน (ช่วงเปิดตัว)
            <IconArrowRight />
          </a>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ============ SECTION 8: FAQ (SEO) ============ */}
      <section id="faq" style={{ background: 'var(--bg-secondary)' }}>
        <div className="section" style={{ maxWidth: '800px' }}>
          <div className="text-center mb-16">
            <h2 className="section-title">
              คำถามที่พบบ่อย
            </h2>
            <p className="section-subtitle mx-auto">
              ข้อมูลเกี่ยวกับระบบรับเงิน QR อัตโนมัติของเปย์หน่อย
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <details className="faq-item">
              <summary>ระบบตรวจสอบสลิปของเปย์หน่อยคืออะไร?</summary>
              <div className="faq-answer">
                ระบบตรวจสอบสลิปของเปย์หน่อยใช้ Omise Payment Gateway ที่ได้มาตรฐาน PCI-DSS ในการยืนยันการชำระเงินแบบ Real-time โดยไม่ต้องเช็คสลิปด้วยตนเอง ลดความเสี่ยงจากสลิปปลอมได้ 100%
              </div>
            </details>

            <details className="faq-item">
              <summary>ใช้เปย์หน่อยกับ Discord ได้ยังไง?</summary>
              <div className="faq-answer">
                เพียงเชิญบอทเปย์หน่อยเข้า Discord Server ของคุณ ใช้คำสั่ง /setup ตั้งค่าสินค้าและ QR Code จากนั้นลูกค้าจะกดปุ่มซื้อ สแกน QR ชำระเงิน และระบบจะแจ้งเตือน + มอบยศให้อัตโนมัติ ไม่ต้องเขียนโค้ด
              </div>
            </details>

            <details className="faq-item">
              <summary>เปย์หน่อยปลอดภัยไหม?</summary>
              <div className="faq-answer">
                ปลอดภัย 100% เราใช้ Omise ซึ่งเป็น Payment Gateway ที่ได้รับมาตรฐาน PCI-DSS ข้อมูลทุกจุดเข้ารหัส SSL/TLS และมีระบบป้องกันการทุจริตหลายชั้น รวมถึง HMAC signature verification สำหรับ webhook
              </div>
            </details>

            <details className="faq-item">
              <summary>รองรับธนาคารอะไรบ้าง?</summary>
              <div className="faq-answer">
                เปย์หน่อยรองรับทุกธนาคารในประเทศไทยผ่านระบบ PromptPay ไม่ว่าจะเป็นกสิกรไทย (KBank) กรุงเทพ (BBL) ไทยพาณิชย์ (SCB) กรุงศรี (BAY) ทหารไทยธนชาต (TTB) และธนาคารอื่นๆ ทุกแห่ง
              </div>
            </details>

            <details className="faq-item">
              <summary>มีค่าใช้จ่ายเท่าไหร่?</summary>
              <div className="faq-answer">
                เปย์หน่อยมีแพ็กเกจฟรีให้เริ่มต้นใช้งาน (1 QR Code) แพ็กเกจ Pro เดือนละ 99 บาท (QR ไม่จำกัด + Dashboard) และ Business เดือนละ 299 บาท (API + Multi-user) ทดลองใช้ฟรี 7 วัน หรือรับสิทธิ์ 14 วันในช่วงเปิดตัว ไม่ต้องใส่บัตรเครดิต
              </div>
            </details>

            <details className="faq-item">
              <summary>QR payment ไทยของเปย์หน่อยต่างจากระบบอื่นยังไง?</summary>
              <div className="faq-answer">
                เปย์หน่อยออกแบบมาเฉพาะสำหรับคนขายของใน Discord โดยรวมระบบรับเงิน QR อัตโนมัติ ระบบตรวจสอบสลิป ระบบแจ้งเตือนการโอนเงินเข้า Discord และระบบมอบยศอัตโนมัติไว้ในที่เดียว ไม่ต้องใช้หลายเครื่องมือ
              </div>
            </details>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ============ SECTION 9: FINAL CTA ============ */}
      <section id="cta" className="hero-bg" style={{ position: 'relative' }}>
        <div className="dot-pattern" />
        <div className="section text-center relative" style={{ zIndex: 2, paddingTop: '100px', paddingBottom: '100px' }}>
          <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ letterSpacing: '-0.03em' }}>
            เริ่มใช้<span className="gradient-text">เปย์หน่อย</span>ฟรี
          </h2>
          <p className="text-lg mb-10 mx-auto" style={{ color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: 1.8 }}>
            เปลี่ยนจาก &quot;นั่งเช็คสลิปเอง&quot; เป็น &quot;ระบบรับเงินอัตโนมัติ&quot; ภายใน 2 นาที
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#auth" className="btn-primary animate-pulse-glow" style={{ fontSize: '1.15rem', padding: '20px 48px' }}>
              เริ่มใช้ฟรี 7 วัน
              <IconArrowRight />
            </a>
            <a href="#auth" className="btn-secondary" style={{ fontSize: '1rem', padding: '18px 36px' }}>
              ทดลองใช้ฟรี 14 วัน (ช่วงเปิดตัว)
            </a>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ============ SECTION 10: AUTH ============ */}
      <section id="auth" style={{ background: 'var(--bg-secondary)' }}>
        <div className="section" style={{ maxWidth: '480px' }}>
          <div className="card-featured" style={{ padding: '40px' }}>
            <div className="text-center mb-8">
              <span className="text-3xl mb-4 block">💸</span>
              <h2 className="text-2xl font-bold mb-2">เข้าสู่ระบบเปย์หน่อย</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>เริ่มใช้งานระบบรับเงิน QR อัตโนมัติด้วยบัญชี Discord ของคุณ</p>
            </div>
            <a
              href="/dashboard/login"
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

      {/* ============ SECTION 11: TRUST + LOCAL SEO ============ */}
      <section>
        <div className="section text-center" style={{ paddingTop: '80px', paddingBottom: '60px' }}>
          <h2 className="text-2xl font-bold mb-4">
            ปลอดภัย · <span className="gradient-text">ใช้งานจริง</span> · เชื่อถือได้
          </h2>
          <p className="text-sm mb-10" style={{ color: 'var(--text-muted)' }}>
            รองรับการใช้งานในประเทศไทย 🇹🇭
          </p>

          {/* Thai Banks */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {[
              '🏦 กสิกรไทย (KBank)',
              '🏦 กรุงเทพ (BBL)',
              '🏦 ไทยพาณิชย์ (SCB)',
              '🏦 กรุงศรี (BAY)',
              '🏦 ทหารไทยธนชาต (TTB)',
              '🏦 กรุงไทย (KTB)',
              '🟢 PromptPay',
            ].map((bank, i) => (
              <div key={i} className="px-5 py-3 rounded-full text-sm font-medium" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                {bank}
              </div>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="trust-badge"><IconShield /> เข้ารหัส SSL/TLS</div>
            <div className="trust-badge"><IconLock /> PCI-DSS Compliant</div>
            <div className="trust-badge"><IconCheck /> ใช้งานจริง 500+ เซิร์ฟเวอร์</div>
          </div>

          {/* Receiver Identity */}
          <div className="card inline-block" style={{ padding: '20px 32px' }}>
            <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>ชื่อ-สกุลผู้รับเงิน (แสดงบนหน้าสลิป)</p>
            <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
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
            <div className="flex items-center gap-2.5">
              <span className="text-xl">💸</span>
              <span className="font-bold">
                เปย์หน่อย
                <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>PayNoi</span>
              </span>
            </div>
            <div className="flex gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
              <a href="#features" className="no-underline hover:underline" style={{ color: 'inherit' }}>ฟีเจอร์</a>
              <a href="#pricing" className="no-underline hover:underline" style={{ color: 'inherit' }}>ราคา</a>
              <a href="#demo" className="no-underline hover:underline" style={{ color: 'inherit' }}>ตัวอย่าง</a>
              <a href="#faq" className="no-underline hover:underline" style={{ color: 'inherit' }}>คำถามที่พบบ่อย</a>
              <a href="#auth" className="no-underline hover:underline" style={{ color: 'inherit' }}>เข้าสู่ระบบ</a>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              © 2026 เปย์หน่อย (PayNoi). All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
