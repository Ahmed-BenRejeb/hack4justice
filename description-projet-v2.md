# Conformité fiscale assistée pour les MSME tunisiennes
## Description du projet — version 2

---

## Le problème

La majorité écrasante des entreprises tunisiennes n'a personne pour s'occuper de la fiscalité. Pas de comptable interne, pas de conseil juridique, pas de budget pour en payer un. Elles doivent pourtant, chaque mois et à chaque paiement fournisseur, produire des déclarations et des certificats exacts.

Résultat : elles se trompent. Pas par fraude — par confusion.

Du côté de l'administration, chaque erreur coûte plus cher qu'elle ne rapporte. L'entreprise paie une pénalité, une fois. La DGI, elle, traite la déclaration corrigée, investigue l'incohérence que l'erreur a créée dans le recoupement, absorbe l'appel au support qui suit, et parfois gère un contentieux. **Une seule erreur évitée à la source supprime plusieurs interventions en aval.**

C'est la phrase qui résume le projet :

> Chaque erreur commise par une entreprise coûte plus à l'administration qu'à l'entreprise elle-même.

---

## Ce que nous traitons — et ce que nous refusons de traiter

Les problèmes fiscaux de l'administration se répartissent en quatre familles. Nous n'en adressons volontairement que deux.

| Famille | Ce que c'est | Traité ? |
|---|---|---|
| **Manquant** | Entreprises qui devraient déclarer et ne le font pas | Non — nécessite la base de données interne de la DGI |
| **Erroné** | Déclaration produite, mais avec des erreurs : mauvais code, mauvais identifiant, mauvais montant | **Oui** |
| **Frauduleux** | Fraude délibérée : fausses factures, revenus dissimulés | Non — relève de l'enquête et de l'exécution |
| **Confus** | Contribuables qui veulent se conformer et n'y arrivent pas | **Oui** |

Ce découpage n'est pas une limite subie, c'est un choix assumé. Construire un outil de détection de fraude, c'est faire de la police fiscale. Construire un outil qui empêche les gens honnêtes d'être sanctionnés pour leur confusion, c'est une autre chose — et c'est la nôtre.

Les entreprises qui commettent ces erreurs ne trichent pas. Elles sont pénalisées pour avoir mal compris.

---

## Le cas d'usage : la retenue à la source

### Pourquoi celui-là

Depuis janvier, toute entreprise doit émettre ses certificats de retenue à la source via la plateforme de la DGI, en sélectionnant le code applicable parmi plusieurs dizaines.

C'est le seul candidat de notre liste où le logiciel doit porter un **jugement**, et non remplir un formulaire.

- La déclaration mensuelle (TVA, retenue, TFP, FOPROLOS, timbre) est la surface d'erreur la plus répétée du pays — mais tout logiciel comptable la couvre déjà.
- La facturation électronique (TEIF) touche une population énorme d'un coup — mais c'est de la plomberie, un problème d'adoption, pas d'intelligence.
- Le choix du code de retenue, lui, exige trois informations sur le fournisseur qui ne figurent nulle part sur la facture : son régime, son statut, la nature réelle de la prestation.

C'est un problème de récupération d'information avec une bonne réponse. C'est exactement ce pour quoi le RAG existe.

Et c'est frais : l'obligation a huit mois, la doctrine a été mise à jour quelques jours avant le hackathon. Personne n'a encore construit pour ça.

### L'histoire qui le porte : l'article 62

Le choix du code est le cœur technique défendable, mais il est abstrait. « Nous sélectionnons le bon code de retenue » ne signifie rien pour un juge non technique.

L'article 62 lui donne un corps : un prestataire réel, qui a fait un travail réel, et qui ne peut pas être payé parce qu'un formulaire est faux. Une personne, un préjudice, une résolution.

Le jury non technique achète la personne. Le jury technique achète le moteur. Cette structure donne les deux sans dédoubler le pitch.

Nous ne remplaçons pas E-Sit-Fisc ni aucun canal de dépôt existant. Nous alimentons ces systèmes avec des données propres avant qu'elles n'y entrent.

---

## Comment ça marche

1. **Ingestion** — l'entreprise dépose son dossier de paiement (PDF ou scan). OCR et extraction structurée : parties, identifiants fiscaux, objet de la prestation, montants, mentions fiscales.
2. **Décision du code** — le système interroge une base documentaire composée de la liste officielle des codes DGI et des articles qui les gouvernent, puis propose le code applicable.
3. **Preuve** — chaque conclusion est accompagnée de l'article exact retrouvé, consultable en un clic. Pas une affirmation du modèle : une citation vérifiable.
4. **Abstention** — quand les informations disponibles ne permettent pas de trancher, le système le dit et indique ce qui manque.
5. **Restitution** — le dossier pré-qualifié est présenté à l'agent, qui voit ce qui a déjà été vérifié automatiquement et valide ou signale sans repartir de zéro.

**Le clic vers la citation est le pitch.** C'est ce qui sépare cette approche d'un modèle qui devine, et c'est la condition pour qu'une administration accorde sa confiance.

---

## Positionnement

e-Tafakna (Tunis, 2022) couvre les documents juridiques entre deux parties privées : modèles de contrats, signature électronique, analyse de clauses à risque. Trois ans d'avance sur ce terrain.

Ils ne touchent pas à la fiscalité. Ni déclarations, ni DGI, ni dépôt auprès de l'administration, ni vue côté agent.

> Les documents juridiques sont couverts en Tunisie. La conformité fiscale avec l'administration ne l'est pas.

Ce n'est pas une menace à écarter, c'est une carte qui montre où se trouve la place vide.

Nous ne faisons pas non plus de vérification de réputation ni de scoring de fournisseur : les praticiens interrogés n'y attachent pas de valeur, et la fonctionnalité a été retirée pour cette raison.

---

## Mesure de l'impact

Nous mesurons la prévention d'erreurs, pas le temps gagné. Le temps gagné est générique — tous les projets le revendiquent.

**Au niveau pilote**
- Taux de conformité au premier dépôt, avant et après. C'est l'indicateur que la DGI pilote réellement.
- Nombre d'erreurs interceptées par dossier, chacune avec sa citation.
- Interventions en aval supprimées : déclaration corrigée, investigation, appel au support.

**Projection nationale**

Volume annuel de certificats de retenue × taux d'erreur observé × interventions par erreur.

Le calcul est posé ouvertement sur la diapositive, chaque entrée sourcée. Un calcul visible avec un résultat modeste convainc davantage qu'un grand nombre inexpliqué — surtout devant un agent qui connaît les vrais chiffres.

---

## Ce qu'il faut vérifier avant de présenter

- La date d'entrée en vigueur exacte de l'obligation.
- Le nombre réel de codes — ne dire « plus de 40 » qu'après les avoir comptés.
- Ce que la mise à jour DGI de cette semaine a effectivement changé. Si un agent de la DGI est dans la salle, c'est la première chose qu'il testera.
- La source du chiffre sur la proportion d'entreprises sans comptable. À défaut, dire « l'écrasante majorité » — c'est gratuit et incontestable.

---

## Les deux questions à préparer

**Où vont les documents ?** Traitement local, ou masquage des données personnelles avant tout appel externe. Une administration posera la question.

**Qui est responsable en cas d'erreur ?** Le système pré-qualifie, l'agent décide. L'humain n'est jamais retiré de la boucle.
