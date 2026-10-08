import { Church, Users, HeartPulse, Wallet, Briefcase } from "lucide-react";

export const AREA_ORDER = ["glaube", "beziehungen", "gesundheit", "ressourcen", "arbeit"];

export const AREA_META = {
  glaube: {
    label: "Glaube",
    icon: Church,
    defaultColor: "#C9906B",
    description:
      "Deine Beziehung zu Gott und das Wachsen im Glauben.",
    questions: [
      "Wie regelmäßig verbringe ich bewusst Zeit mit Gott. Im Gebet, in der Bibel, in der Stille?",
      "Wachse ich gerade geistlich oder stehe ich eher still?",
      "Wann habe ich zuletzt bewusst etwas investiert, das meinen Glauben stärkt?",
      "Merkt man meinem Alltag an, was ich glaube?",
    ],
  },
  beziehungen: {
    label: "Beziehungen",
    icon: Users,
    defaultColor: "#A13D3D",
    description:
      "Partnerschaft, Familie, Freundschaften und Gemeinschaft.",
    questions: [
      "Habe ich Menschen in meinem Leben, bei denen ich ganz ich selbst sein kann und die wissen, wie es mir wirklich geht?",
      "Gibt es ungelöste Konflikte oder Beziehungen, die mich aktuell stark Kraft kosten?",
      "Wie investiere ich in meine wichtigsten Beziehungen (Partner, Familie, enge Freunde)?",
      "Erlebe ich eine gesunde Balance zwischen dem Geben und Nehmen von Unterstützung?",
      "Bin ich selbst ein guter Freund, eine gute Freundin?",
    ],
  },
  gesundheit: {
    label: "Gesundheit",
    icon: HeartPulse,
    defaultColor: "#3F6A52",
    description:
      "Körperliches und geistiges Wohlbefinden.",
    questions: [
      "Wie fit, energiegeladen und belastbar fühle ich mich körperlich und mental?",
      "Achte ich auf ausreichend Schlaf, gesunde Ernährung und regelmäßige Bewegung?",
      "Schaffe ich mir bewusst Räume für echte Erholung und Pausen?",
      "Wie gehe ich mit Stress um und erkenne ich rechtzeitig meine Grenzen?",
    ],
  },
  ressourcen: {
    label: "Ressourcen",
    icon: Wallet,
    defaultColor: "#C97D3B",
    description:
      "Umgang mit Zeit, Geld und Begabungen.",
    questions: [
      "Habe ich einen guten, weisen Überblick über meine Finanzen (Budget, Konsum, Sparen)?",
      "Nutze ich meine Zeit so, dass sie meinen eigentlichen Werten und Prioritäten entspricht?",
      "Setze ich meine Gaben und Talente sinnvoll ein? Sowohl für mich als auch für andere?",
      "Erlebe ich finanzielle Freiheit oder engt mich dieser Bereich (z. B. durch Schulden oder Sorgen) stark ein?",
    ],
  },
  arbeit: {
    label: "Arbeit",
    icon: Briefcase,
    defaultColor: "#2C6E68",
    description:
      "Beruf, Studium und alltägliches Schaffen.",
    questions: [
      "Bereitet mir meine tägliche Arbeit (Beruf, Studium, Haushalt) grundsätzlich Freude und Sinn?",
      "Kann ich in meinem Job oder meinen Aufgaben meine Stärken gut einbringen?",
      "Wie ist die Atmosphäre im Team oder an meinem Arbeitsplatz?",
      "Stimmt das Verhältnis zwischen Arbeitsleistung und der Zeit für mein Privatleben (Work-Life-Balance)?",
    ],
  },
};

export const VERSE =
  "Liebe Gott (Glaube) und deinen Nächsten (Beziehungen), wie dich selbst (Gesundheit) mit allem was dir gegeben wurde (Ressourcen) und dort wo du hingestellt wurdest (Arbeit).";
