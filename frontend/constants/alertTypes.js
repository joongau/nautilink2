

const alertTypes = [
  {
    type: 'danger',
    label: 'Danger général',
    icon: '⚠️',
    description: "Obstacles inconnus, épaves ou dangers temporaires en mer. À signaler pour la sécurité des autres navigateurs.",
    comment: '',
    photo: null
  },
  {
    type: 'reef',
    label: 'Haut-fond / Récif',
    icon: '🪨',
    description: "Zone à risque d'échouage : haut-fond non cartographié, récif à fleur d’eau.",
    comment: '',
    photo: null
  },
  {
    type: 'traffic',
    label: 'Trafic dense',
    icon: '🚢',
    description: "Beaucoup de bateaux dans une zone : ralentissement, congestion, vigilance accrue.",
    comment: '',
    photo: null
  },
  {
    type: 'forbidden',
    label: 'Zone interdite',
    icon: '🛑',
    description: "Zone de navigation interdite : militaire, réserve naturelle, port sécurisé, etc.",
    comment: '',
    photo: null
  },
  {
    type: 'sea_state',
    label: 'Mer dangereuse',
    icon: '🌊',
    description: "Conditions de mer très dégradées : creux, vagues croisées, houle dangereuse.",
    comment: '',
    photo: null
  },
  {
    type: 'wind',
    label: 'Rafales de vent',
    icon: '💨',
    description: "Rafales ou changement soudain de vent. Utile pour prévenir les voiliers.",
    comment: '',
    photo: null
  },
  {
    type: 'help',
    label: 'Appel à l’aide',
    icon: '🛟',
    description: "Problème technique ou humain nécessitant de l’assistance ou de l’entraide immédiate.",
    comment: '',
    photo: null
  },
  {
    type: 'wildlife',
    label: 'Faune observée',
    icon: '🐋',
    description: "Signalement de dauphins, baleines, méduses ou autres animaux en mer.",
    comment: '',
    photo: null
  },
  {
    type: 'anchor',
    label: 'Mouillage difficile',
    icon: '⚓',
    description: "Tenue mauvaise ou difficile : fonds rocailleux, zone mal protégée ou vent tournant.",
    comment: '',
    photo: null
  },
  {
    type: 'beacon',
    label: 'Bouée sonore / Phare',
    icon: '🔊',
    description: "Balise utile la nuit ou en cas de visibilité réduite. Aide à la navigation.",
    comment: '',
    photo: null
  }
];

export default alertTypes;