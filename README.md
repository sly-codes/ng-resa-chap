# ResaChap - Client (Angular)

[![Angular](https://img.shields.io/badge/Angular-17%2B-red?logo=angular)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9%2B-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Styles](https://img.shields.io/badge/Styles-SCSS-CC6699?logo=sass)](https://sass-lang.com/)
[![Bootstrap](https://img.shields.io/badge/Framework-Bootstrap-7952B3?logo=bootstrap)](https://getbootstrap.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 💡 Description du Projet

Ce dépôt contient le code du client **ResaChap**, l'application web front-end construite avec **Angular**. ResaChap est une plateforme de **réservation de ressources en ligne** (biens, équipements, espaces) permettant aux utilisateurs de devenir **Locataires** (réserver une ressource) ou **Locateurs** (mettre leur propre ressource en location).

L'application se concentre sur une expérience utilisateur fluide et l'interaction sécurisée avec l'API NestJS.

## 🚀 Fonctionnalités Implémentées

* **Authentification Complète :** Connexion/Inscription standard et sociale (Google).
* **Navigation Sécurisée :** Utilisation d'Angular Guards pour protéger l'accès au tableau de bord et aux routes sensibles.
* **Gestion des Formulaires :** Implémentation de formulaires réactifs pour l'authentification et les futures actions (réservation, ajout de ressource).
* **Composants Réutilisables :** Composants d'authentification autonomes et stylisés en SCSS/Bootstrap.
* **Retour Utilisateur :** Mise en place d'un service de toasts (`ToastService`) pour les notifications de succès et d'erreurs.

## 🛠️ Stack Technique Frontend

| Catégorie | Technologie | Rôle |
| :--- | :--- | :--- |
| **Framework** | **Angular (v17+)** | Construction de l'interface utilisateur. |
| **Langage** | **TypeScript** | Code source typé et maintenable. |
| **Styles** | **SCSS & Bootstrap** | Préprocesseur CSS et framework pour le design réactif. |
| **Routing** | **Angular Router** | Gestion de la navigation et des Guards. |

## 📦 Installation et Lancement

### Prérequis

* Node.js (v18+)
* Angular CLI (`npm install -g @angular/cli`)

### Étapes

1.  Clonez ce dépôt :
    ```bash
    git clone https://github.com/sly-codes/ng-resa-chap.git
    cd ng-resa-chap
    ```
2.  Installez les dépendances :
    ```bash
    npm install
    ```
3.  Lancez le serveur de développement :
    ```bash
    ng serve -o
    ```
    L'application sera accessible sur `http://localhost:4200/`. Assurez-vous que le backend NestJS est également en cours d'exécution.

## 🤝 Contribution

Pour toute contribution ou suggestion, veuillez ouvrir une *Issue* sur ce dépôt.