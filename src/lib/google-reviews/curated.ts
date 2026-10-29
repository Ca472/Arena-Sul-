/**
 * Testimonials selected from Google's public reviews on 2026-10-24.
 * Aggregate rating and count verified on 2026-10-28.
 * This is not a live API response. Change verifiedOn only after a new check.
 * The aggregate includes every rating; the selected testimonials are 5-star
 * reviews with text, chosen from the recent reviews.
 */
export const GOOGLE_REVIEW_SNAPSHOT = {
  rating: 4.6,
  totalReviewCount: 735,
  verifiedOn: "2026-10-28",
  reviews: [
    {
      id: "106904439667208395818",
      author: "Isabella Dias",
      rating: 5,
      text: "Atendimento e qualidade excelente! Estrutura top da arena também!",
      url: "https://share.google/pDFkVkThgOIYorPMS",
    },
    {
      id: "117139557292221563835",
      author: "Tainá Rodrigues",
      rating: 5,
      text: "Atendimento da Katia é excepcional. Lugar maravilhoso.",
      url: "https://share.google/O8ddgKj5VHvcjPhzS",
    },
    {
      id: "104154122542574059824",
      author: "bruna Souza",
      rating: 5,
      text: "Melhor lugar para aulas de futevolei , super recomendado, excelente atendimento com pessoas maravilhosas. Volei com a galera tb é super legal.",
      url: "https://share.google/zMhFoa1Hg3m0O7WfJ",
    },
    {
      id: "111710073273260280901",
      author: "Beatriz Siqueira",
      rating: 5,
      text: "Lugar incrível, bom acolhimento, excelente Atendimento, super recomendo .",
      url: "https://share.google/OJYzeRCcZPUsM5L6Z",
    },
  ],
} as const;
