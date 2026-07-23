import { Variants, Transition } from "framer-motion";

// ── Shared Transitions ──

export const spring: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export const springBouncy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 25,
};

export const springGentle: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 25,
};

export const smoothEase: Transition = {
  type: "tween",
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1],
};

export const slowEase: Transition = {
  type: "tween",
  duration: 0.5,
  ease: [0.4, 0, 0.2, 1],
};

// ── Fade Variants ──

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: smoothEase },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: spring },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: spring },
  exit: { opacity: 0, y: 10, transition: { duration: 0.15 } },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: spring },
  exit: { opacity: 0, x: 10, transition: { duration: 0.15 } },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: spring },
  exit: { opacity: 0, x: -10, transition: { duration: 0.15 } },
};

// ── Scale Variants ──

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 350, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

// ── Slide Variants ──

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: springGentle },
  exit: { opacity: 0, y: 20, transition: { duration: 0.2 } },
};

export const slideInLeft: Variants = {
  hidden: { x: -280 },
  visible: { x: 0, transition: spring },
  exit: { x: -280, transition: { duration: 0.2 } },
};

// ── Stagger Children ──

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerSlow: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// ── Card Hover ──

export const cardHover = {
  whileHover: {
    y: -4,
    boxShadow: "0 12px 40px rgba(99, 102, 241, 0.15)",
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
};

// ── Page Transition ──

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2 },
  },
};

// ── List Item ──

export const listItem: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.03,
      ...springGentle,
    },
  }),
};

// ── Counter ──

export const counterAnimation = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
};

// ── Scroll Reveal ──

export const scrollReveal: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  },
};

// ── Staggered Scroll Reveal ──

export const scrollRevealStagger = (index: number) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-30px" },
  transition: {
    delay: index * 0.08,
    duration: 0.5,
    ease: [0.4, 0, 0.2, 1],
  },
});
