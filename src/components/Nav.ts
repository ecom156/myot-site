export type NavItem = { label: string; href: string; children?: NavItem[] };

// 問い合わせは会社サイトのフォームで受ける
export const CONTACT = 'https://ecominc.co.jp/contact/';

export const nav: NavItem[] = [
  { label: 'HOME', href: '/' },
  {
    label: 'サービス紹介',
    href: '/service/',
    children: [
      { label: '初めての方へ', href: '/first/' },
      { label: 'サービスコンセプト', href: '/concept/' },
      { label: '先生紹介', href: '/teachers/' },
      { label: '英検講座料金と支払い方法', href: '/price/' },
      { label: 'システム一覧表', href: '/system/' },
    ],
  },
  { label: '英検®対策講座の受講案内', href: '/online-classes/eiken/' },
  { label: 'よくある質問と回答', href: '/faq/' },
  { label: 'お知らせ', href: '/blog/' },
  {
    label: 'お問い合わせ',
    href: CONTACT,
    children: [
      { label: 'ECOM英語学校紹介', href: '/school/' },
      { label: '特定商取引法表示', href: '/特定商取引法表示/' },
      { label: 'プライバシーポリシー', href: '/特定商取引法表示/privacy/' },
      { label: 'お問い合わせフォーム', href: CONTACT },
    ],
  },
];
