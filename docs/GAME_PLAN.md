# Chilahati Village Simulation Game Plan

Prepared 18 November 2026. Initial design for a browser based 3D game.

Confirmed platform and vehicle scope: support both Android and PC, with motorcycles, bicycles and vans. The same village, activities and progression should be available on both platforms, with suitable controls and graphics settings.

The final world will cover the wider Chilahati area in Domar, Nilphamari, including every additional market named below. Players will recognize the real roads and landmarks while creating their own fictional village life: earning, studying, buying property, running businesses, helping neighbours, stealing, or causing trouble.

The defining feature is a recognizable Chilahati that reacts to the player. Geographic accuracy and enjoyable everyday activities are the two tests for every development phase. All missions, NPC identities, prices, crimes, and economic rules below are proposed game designs.

## 1 Working concept

Suggested name: **চিলাহাটি জীবন**.

Use a third person camera for walking and a following camera for vehicles. Players should be able to walk to the station, recognize a junction, read an actual Bengali hotel sign, rent a van, buy food, and meet a recurring customer.

Recommend single player first, with a connected simulation of NPCs. Friends playing together can be a later phase once the world and economy work reliably. This is a planning assumption, subject to the user's preference.

The player chooses an initial ambition but can change direction:

| Ambition | Typical activities | Long term milestones |
| --- | --- | --- |
| Become rich | Transport, deliveries, trading, shop management, investment | Own a home, vehicles, profitable businesses and employees |
| Become respected | Free rides, teaching, returning lost items, community work | Trusted customers, strong relationships and community projects |
| Become a villain | Theft, dishonest deals, provoking fictional rivals, fights | Risky opportunities alongside complaints, lost trust and police attention |

Wealth, trust, personal relationships, skills, and police attention are separate values. A wealthy player can also be generous. A troublemaker can repay people and rebuild trust.

## 2 Required world coverage

These are required coverage anchors, not a confirmed ordering of places on a road. No connecting road or distance has yet been surveyed for this project.

| Required place or area | Current naming status | Intended game use |
| --- | --- | --- |
| Chilahati Railway Station | Public station references and historical photographs found | Passenger rushes, goods deliveries, food demand and meeting point |
| Chilahati Dakghor | Bangladesh Post lists Chilahati SO, postcode 5341; exact building frontage and entrance still to verify | Landmark, parcel and delivery missions |
| Central Chilahati and connecting neighbourhoods | User confirmed whole area coverage | Homes, local services, shops and everyday travel |
| Botolganj Bazar | Strong source match: বোতলগঞ্জ বাজার | Trade, deliveries and businesses |
| Kazirhat | LGED map labels Kazir Hat; Bengali spelling and exact extent to confirm | Market trips and local jobs |
| Boaed Bazar | User supplied name; Board Bazar is a tentative reading only | Included in scope; pin and Bengali spelling pending |
| Bouer Bazar | Likely বউবাজার or বউ বাজার; local confirmation pending | Included in scope; residential and commercial gameplay |
| Schools and colleges throughout the agreed area | Chilahati Government College and Chilahati Merchants High School confirmed in official sources | Study, tutoring, school transport, stationery and events |
| Mosques throughout the agreed area | User requested; individual names, positions and audio references to collect | Recognizable landmarks, prayer schedules and spatial azan audio |
| Shops, hotels and restaurants | Actual names and sign photographs to collect | Shopping, meals, work and business ownership |
| Homes, fields, ponds and smaller lanes | To inventory within the final perimeter | Housing, exploration, shortcuts and later rural activities |

“Whole Chilahati” will mean the user's intended lived area, including the named markets. A postcode or a single village label is insufficient to define that perimeter. Establish the outer roads and settlements before counting total area or promising a completion date.

All required areas remain in the final scope. Development zones are a production method; they do not shrink the final map.

## 3 How to achieve the actual 3D view

Use geographic data for the road and railway skeleton where coverage exists, then verify it locally. OpenStreetMap's basic 3D tags describe building volumes; they do not automatically recreate current shopfronts, signs, interiors or every Chilahati building. [S5]

Preserve real junctions, road connections, railway alignment, landmark positions, orientation and relative distances. Build a larger world rather than moving markets closer for convenience.

Use three levels of modeling:

- Custom models for the railway station, Dakghor, important schools, colleges, mosques and distinctive market corners.
- Reusable local building parts, adjusted to reference photographs, for ordinary shops and homes.
- Simpler distant scenery for fields, trees and background buildings.

Simplification should reduce visual detail while keeping important layouts recognizable. Selected buildings can have playable interiors; full custom interiors for every house are a separate, much larger task.

Collect each priority place with a front photograph, two side angles, entrance, sign close-up and wider street view. A continuous roadside video helps establish the order of shops and appearance of junctions.

Maintain one place register containing: ID, Bengali name, English alias, coordinates, entrance location, reference date, source, photos, confidence, model status and local verifier. Unknown names stay unknown until checked.

Keep Bengali text as Unicode. Use the spelling on the real sign, a Bengali-capable font, and manual visual checking of conjuncts. Hotel signs should retain their actual Bengali names. Clarify whether each hotel is a food hotel, lodging business, or both.

Use permitted map data and photographs, and retain attribution and licence information. OSM attribution and applicable ODbL requirements belong in the production checklist. [S6]

## 4 The first ten minutes

1. Start at a modest home or rented room with limited cash and an ambition.
2. Check opportunities: station passengers, a shop delivery, or a customer needing transport.
3. Rent a van and complete the first short route.
4. Meet a choice: accept a paid trip, give a free ride, return a forgotten bag, or try to keep it.
5. Buy food, repair the vehicle if needed, and review earnings.
6. Put money toward a repayment, stock, vehicle ownership or housing.
7. Receive a consequence: a referral, returning customer, complaint or new mission.

A session should be useful even when the player only has ten minutes. Saving should work without completing a full game day.

Start with an adjustable game clock. Test a roughly one hour real-time day as an initial setting, then tune it around journeys, business shifts and azan playback. This duration is a proposal, not a fixed requirement.

## 5 The village economy and NPC ecosystem

NPCs have a home, work location, routine, limited budget, needs and a memory of relevant encounters. Teachers travel to institutions; shopkeepers need stock; passengers want rides and food; mechanics need parts. Nearby NPCs act visibly while distant activity is summarized.

| Simulated event | Immediate effect | Connected opportunity |
| --- | --- | --- |
| A train arrives | Passengers appear and local demand rises | Van rides, luggage delivery, tea and meals |
| School opens or closes | Travel and stationery demand change | Student transport, exercise book delivery |
| A shop runs low | Customers switch shops or wait | Supply deliveries, restocking or competition |
| Rain begins | Some journeys slow and customers change plans | Careful driving, nearby deliveries |
| A vehicle breaks down | Transport capacity falls | Repair work, helping the driver, replacement rides |
| Prayer time arrives | Some NPCs pause work or travel to a mosque | A visible change in village routines |

Train timings and market rushes are initially fictional game schedules. Real timetables can inform a later version after verification.

Begin with a small inventory: tea ingredients, meals, groceries, stationery and vehicle supplies. Stock and customer demand limit sales. Buyers have budgets; purchases move goods; rent, upkeep and supplies consume money.

Outside travellers and suppliers can introduce money and goods so the simulation does not depend on a perfectly closed economy. Track transaction reasons to make balancing understandable.

## 6 Native jobs and progression

| Role | What the player does | Progression |
| --- | --- | --- |
| Van driver | Pick up people, choose routes, transport goods, drive carefully | Rent a van, buy one, upgrade it, hire a driver |
| Tea seller | Prepare orders, manage a queue, buy ingredients | Small setup, better equipment, larger shop |
| Shopkeeper | Buy stock, set prices, respond to requests | Small counter, wider inventory, employee |
| Hotel worker or owner | Serve meals, manage supplies and lunch rushes | Worker, manager, business operator |
| Student | Attend short lessons, complete tasks, balance study and work | Skills, qualifications and new opportunities |
| Tutor or teacher | Lesson puzzles, helping students, attendance tasks | Tutoring followed by a qualified career path |
| Delivery worker | Carry goods or fictional parcels between verified locations | Better contracts and regular customers |
| Mechanic | Simple diagnosis and repair interactions | Tools, workshop and employees |
| Bike rental operator | Maintain bikes and manage returns | One rental bike, then a small fleet |

Both motorcycles and bicycles are confirmed alongside pedal vans. Bicycles offer inexpensive travel using stamina; motorcycles offer faster travel with fuel and maintenance costs; vans support passenger and goods work. Include rental, purchase, parking and upkeep appropriate to each vehicle.

Choose the starting character's age before writing school and employment progression. A young adult attending college while doing part time work is one workable starting scenario; a school-student mode can have its own progression.

## 7 Buying homes, food and vehicles

The purchase system should support many useful categories:

- Food and drinks that restore energy.
- Clothing and cosmetic items.
- Bicycles, motorcycles, vans, repairs, fuel where relevant, and upgrades.
- Homes, rented rooms, furnishings, storage and garages.
- Business equipment, stock and shop leases.
- Later, land or additional properties when the economy can support them.

Keep the progression readable: rented transport and room, owned vehicle, better housing, first business, employees and expansion. Each major purchase should change play.

A house can provide storage, a bed, cooking, decoration and a garage. A business can provide recurring orders and employee management. Food supports short breaks without requiring constant purchases to avoid failure.

Real exteriors can represent fictional in-game ownership. The game should not imply that the real owner has sold their property. Start with a selected catalogue of purchasable properties and expand it.

## 8 Loans, savings and fair progression

Players can borrow to finance a purchase or business. Later, they may lend to fictional NPCs through a simple loan interaction.

Before borrowing, display the amount received, total repayment, instalment size and due dates. Begin with bounded, simple terms and tune them through playtesting.

Distinguish business profit from cash flow: buying a vehicle and paying a loan instalment affect cash differently from daily operating costs. Give the player a short ledger showing earnings, expenses, repayments, assets and debt.

Renting should make early work possible without a large loan. Missed repayments can reduce access to new credit or trigger a negotiation mission. Keep basic paid work available so the player can recover.

Free rides cost time and income, but may build a relationship or bring a later referral. Repeatedly helping the same NPC in the same way should not create unlimited rewards.

## 9 Theft, fighting and police

Allow theft as a fictional game choice. An item can have an owner, value, evidence state and return status. Being seen or reported creates consequences; every NPC does not instantly know what happened.

Consequences can include loss of trust, restitution, an appropriate in-game fine, or temporary detention. Serious incidents escalate more quickly than small mistakes. These rules are game mechanics, not a recreation of Bangladeshi criminal procedure.

Stolen vehicles should remain distinct from vehicles the player owns, so theft does not replace the whole purchase ladder. Unresolved theft can block lawful resale or services. Do not reward repeated theft of endlessly respawning valuables.

For fights, distinguish the player's action from merely standing near a clash. A witness report or patrol observation triggers a response after a believable delay. Use one resolved penalty per incident, with clear feedback about what happened.

Returning property, repaying someone and completing restitution can repair relationships. Failure should generate a new story and a recovery route.

## 10 Mosques and azan

Include real mosques inside the agreed coverage area, using verified names, exterior references and entrance positions.

Schedule azan for the five daily prayers: ফজর, যোহর, আসর, মাগরিব and এশা. Use a verified timetable or a locally validated location-and-date calculation. Prayer times change by date; do not hardcode five clock times for the entire year. Store prayer-start time, each mosque's azan time and jamaat time separately.

Default proposal: prayer events follow the in-game date and clock. A separate real-time mode can follow Asia/Dhaka local time if wanted. These modes must remain explicit so an accelerated game day is not confused with the real prayer schedule.

Play a suitable recorded azan from the relevant mosque's location, with distance fading and a dedicated volume control. Use a recording made for the game with permission or an appropriately licensed recording. Preserve correct audio playback speed even when game time is accelerated.

Load only nearby mosque audio sources. Nearby calls can overlap naturally, with a manageable mix; crossing a map zone must not restart the same call. NPCs may pause their routines or attend prayer while the player remains free to continue playing.

Keep an event record so pausing, saving or changing time speed does not replay the same azan repeatedly. Sleeping or skipping time should not play a backlog of missed calls. A timetable, source recording and audio demonstration should be reviewed during local validation.

## 11 Humour and stories that create replay value

Use recurring fictional personalities, short Bengali dialogue and everyday complications.

| Mission idea | Main choice or challenge |
| --- | --- |
| ব্যাগটা কার | Find a passenger who forgot a bag, or risk keeping it |
| চা ঠান্ডা হওয়ার আগে | Deliver tea quickly without spilling it |
| স্যারের খাতা | Recover misplaced exercise books before class |
| এক ভ্যানে কত কাজ | Combine passenger trips and deliveries within capacity |
| ছাগল রাস্তা ছাড়ে না | Wait, guide an animal aside, or take another route |
| বাকির খাতা | Decide which fictional customers receive shop credit |
| নিজের বাড়ির চাবি | Complete the first home purchase and move in |

Add rotating opportunities, evolving customer relationships, house decoration, vehicle upgrades and businesses whose appearance improves. A village news or gossip board can explain recent consequences and hint at new work.

The player should want to return because a plan is developing: the next vehicle payment, a new shop, a regular passenger, or a changed relationship.

## 12 Build sequence with the entire map in scope

| Stage | Deliverable | Acceptance condition |
| --- | --- | --- |
| 1 World survey | All required coverage anchors, outer perimeter, source register and route inventory | No named market silently omitted; ambiguous names flagged |
| 2 Whole area foundation | Connected road and rail layout across the agreed area, simple building blocks | Locals confirm major routes, junctions and landmark placement |
| 3 Playable demonstration | Detailed station and Dakghor area, walking, one drivable van, rental, food, small NPC cast, one shop interaction, basic theft/police, one mosque and scheduled azan, saving; Android touch and PC keyboard/mouse controls | A short session is recognizable, enjoyable and playable on both platforms |
| 4 First full gameplay release | Required markets connected; motorcycle and bicycle rental/purchase; property purchase; loans; study/tutoring; tea and shop businesses; more local mosques and missions | Each requested system has a working end-to-end activity on Android and PC |
| 5 Local detail and depth | More accurate shopfronts, Bengali hotel signs, school and college models, interiors, NPC routines and additional buyable items | Whole area coverage and a documented landmark/sign review |
| 6 Expansion | Employees, richer property management, rural businesses, seasons and possibly cooperative multiplayer | Added systems preserve performance, saves and economy balance |

The demonstration is a test stage within the larger map project. It is not the final coverage limit.

No reliable cost or delivery date can be given before the perimeter, building inventory, art quality, test devices and team capacity are known. Estimate after the world survey and first measured scene.

## 13 Technical direction and validation

Proposed browser stack: TypeScript with Babylon.js for 3D, Blender for custom assets, and a small UI layer for inventory, dialogue and the ledger. This is an architectural recommendation, not an implementation already selected or built.

Android and PC are both release targets from the first playable demonstration. Begin with browser access on each; a separately packaged Android app can be considered later. Do not promise an APK or app-store release as part of this browser-first plan.

| Area | Android design | PC design |
| --- | --- | --- |
| Walking and camera | Left virtual joystick, right-side camera drag, large interaction buttons | WASD movement, mouse camera, interaction key |
| Vehicles | Steering controls, accelerator/pedal and brake buttons, mount/dismount button | Keyboard steering, acceleration/pedalling and braking, mount/dismount key |
| Menus and graphics | Readable touch menus, adjustable button sizes, low/medium graphics options | Mouse-friendly menus, remappable controls, scalable graphics options |

Keep the geographic layout and gameplay systems consistent across devices. Reduce distant detail, shadow quality and visual effects when necessary for performance. Cross-device cloud saves are a separate feature, not implied by support for both platforms.

Load nearby map zones, use repeated-object instances, and simplify distant models. Babylon.js documents instances and level-of-detail tools for these purposes. [S7] Nearby NPCs need full movement; distant NPCs can use summarized state.

Keep economy, inventory, quest state, property ownership, time and incident handling separate from rendering. Start with local saves; add accounts and server-backed persistence when there is a clear need. Multiplayer ownership and trading would need server authority.

Choose an actual Android phone and PC/laptop as test devices. Proposed targets are stable 30 FPS on the selected Android device and 60 FPS on the selected PC at suitable graphics settings. These are targets to measure, not guarantees for every device.

Acceptance checks:

- Can residents travel between the required markets without wrong turns caused by the map?
- Can they recognize the station, Dakghor and key landmarks without labels?
- Are Bengali signs correct and readable?
- Can a player rent a van, earn, eat, repay and save?
- Can the player buy a vehicle and home and retain them after loading?
- Can the player rent, ride, purchase and park both a bicycle and a motorcycle?
- Does theft create a clear, recoverable consequence?
- Does each azan event occur once at the intended game time with correct audio?
- Are walking, driving, shopping and menus usable with Android touch controls and PC keyboard/mouse controls?
- Do the selected Android and PC devices handle a busy scene at their intended settings?

## 14 Decisions and local references still needed

1. The Bengali spelling or map pin for Boaed Bazar, plus confirmation of Bouer Bazar.
2. The outer limits of the wider Chilahati area to include.
3. Current photos/video of landmarks, shop and hotel signs, and mosques.
4. Starting character age and whether single player is the first release.
5. Whether azan follows the accelerated game clock or real Dhaka time.

Already confirmed: both Android and PC; both motorcycles and bicycles, alongside vans. These are requirements rather than open questions.

Suggested defaults: young adult protagonist, single player, third person view, geographically faithful 3D with optimized art, and prayer events following the game clock.

## Sources and evidence limits

Research checked 18 November 2026. These sources identify places and workflows; they do not constitute a current surveyed 3D model.

- **S1** [Bangladesh Post Nilphamari postcodes](https://bdpost.gov.bd/pages/static-pages/6922df1f933eb65569e1fffe): lists Domar / Chilahati SO / 5341. Does not establish the exact Dakghor building entrance or appearance.
- **S2** [Chilahati Government College official website](https://cgcn.college.gov.bd/) and [Domar official education institute list](https://domar.nilphamari.gov.bd/pages/education-institutes): institution identity and address. Still requires current model references.
- **S3** [Khankaye Keramotia High School website](https://khankayeahs.dgwc.edu.bd/): identifies বোতলগঞ্জ বাজার in its location description.
- **S4** [LGED Domar map](https://oldweb.lged.gov.bd/uploadeddocument/Map/RANGPUR/nilphamari/domar/domar.pdf): labels Chilahati Hat and Kazir Hat. Compiled from older sources with field checking in 2016; marked for LGED internal use and not authoritative for other use. Use only as contextual evidence here, not as a promised current precision or reusable game asset.
- **S5** [OSM Simple 3D Buildings](https://wiki.openstreetmap.org/wiki/Simple_3D_Buildings): basic building attributes and modeling limits.
- **S6** [OSM copyright and licence](https://www.openstreetmap.org/copyright) and [OSMF attribution guidelines](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines#Computer_games_and_simulations): applicable attribution and data licensing information.
- **S7** [Babylon.js instances](https://doc.babylonjs.com/features/featuresDeepDive/mesh/copies/instances) and [mesh level of detail](https://doc.babylonjs.com/features/featuresDeepDive/mesh/simplifyingMeshes): rendering tools supporting the proposed optimization approach.
- **S8** [Chilahati station photograph by Kayser Ahmad](https://commons.wikimedia.org/wiki/File:Chilahati_railway_station_(1).jpg): author-supplied photograph dated 13 December 2015, under CC BY-SA 4.0. Useful historical reference; does not prove today's facade.

