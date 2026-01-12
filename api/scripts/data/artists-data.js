// Base de datos de artistas organizados por género
// Archivo separado para facilitar mantenimiento y actualizaciones

const artistsByGenre = {
  "afrobeat": ["Fela Kuti","Tony Allen","Burna Boy","Wizkid","Davido","Seun Kuti","Femi Kuti","Mr Eazi","Yemi Alade","Tiwa Savage","Rema","Tems","CKay","Fireboy DML","Olamide","P-Square","Kizz Daniel","Ayra Starr","Tekno","Joeboy","Antibalas","Orlando Julius","Ebo Taylor"],
  "alternativeRock": ["Radiohead","Red Hot Chili Peppers","Arctic Monkeys","Coldplay","The Killers","Pixies","Sonic Youth","The Verve","Muse","Oasis","Blur","The Smashing Pumpkins","R.E.M.","Beck","Placebo","Interpol","Kasabian","Franz Ferdinand","Foo Fighters","Queens of the Stone Age","The Cure","Nick Cave & The Bad Seeds","Florence + The Machine","Live","Collective Soul","Everclear","Imagine Dragons","Falling in Reverse","Hozier","Primus","Electric Callboy","Panic! At The Disco","Sleep Token","Twenty One Pilots","Alpha Wolf","The Smiths","YUNGBLUD","Limp Bizkit"],
  "arregladores": ["Gerardo Gardelin","Nora Sarmoria","Gustavo Spatocco","Leo Sujatovich","Lito Vitale"],
  "autoresCompositores": ["Lisandro Aristimuño","Vero Bellini","Juana Molina","Lilián Saba"],
  "bachata": ["Romeo Santos","Aventura","Prince Royce","Zacarías Ferreira","Joe Veras","Antony Santos","Frank Reyes","Luis Vargas","Andy Andy","Yoskar Sarante","El Torito (Héctor Acosta)","Héctor Acosta","Kiko Rodríguez","Monchy & Alexandra","Teodoro Reyes","Raulín Rodríguez","Ramón Cordero","Leonardo Paniagua","Blas Durán","Grupo Extra","Toby Love","Andy Lucas"],
  "balada": ["José José","Rocío Dúrcal","Camilo Sesto","Juan Gabriel","Cristian Castro","Laura Pausini","Alejandro Sanz","Ana Gabriel","Ricardo Montaner","Yuri","Mijares","Chayanne","Emmanuel","Sandro","Myriam Hernández","Pablo Alborán","David Bisbal","Silvina Garré","Dany Martin","Marcela Morelo","Pimpinela","Marco Antonio Solís","Joaquín Sabina","Eros Ramazzotti","Ella Baila Sola","Yuridia","Piero"],
  "blackMetal": ["Mayhem","Burzum","Emperor","Darkthrone","Immortal","Gorgoroth","Enslaved","Satyricon","Bathory","Carpathian Forest","Marduk","Dissection","1349","Watain","Dimmu Borgir","Naglfar","Taake","Ulver","Borknagar","Beherit"],
  "bluegrass": ["Bill Monroe","Earl Scruggs","Ricky Skaggs","Alison Krauss","Flatt & Scruggs","Del McCoury","Tony Rice","Sam Bush","The Stanley Brothers","Doc Watson","Béla Fleck","JD Crowe","Rhonda Vincent","Chris Thile","Punch Brothers","Doyle Lawson","Blue Highway","Mountain Heart","Larry Sparks","Dailey & Vincent"],
  "blues": ["B.B. King","Muddy Waters","Buddy Guy","Robert Johnson","Stevie Ray Vaughan","John Lee Hooker","Etta James","Eric Clapton","Howlin' Wolf","Joe Bonamassa","Bessie Smith","Albert King","Freddie King","Elmore James","John Mayall","Willie Dixon"],
  "bluesRock": ["Javier Martínez (Manal)","Billy Gibbons","Rory Gallagher","Jimi Hendrix","The Allman Brothers Band","ZZ Top","Cream","Gary Moore","The Black Keys","Derek and the Dominos","Gary Clark Jr.","John Mayer","Gov't Mule","Bonnie Raitt","Beth Hart","Tedeschi Trucks Band","Humble Pie","The Jeff Beck Group","The Jimi Hendrix Experience"],
  "bolero": ["Trío Los Panchos","Los Panchos","Armando Manzanero","Antonio Machín","José Feliciano","Lucho Gatica","Julio Jaramillo","Los Tres Reyes","Daniel Santos","Olga Guillot","Marco Antonio Muñiz","Bienvenido Granda","Alfredo Sadel","Alberto Cortez","Vicente Garrido","Javier Solís","Eydie Gormé","Bobby Capó","Ibrahim Ferrer"],
  "bossaNova": ["João Gilberto","Antonio Carlos Jobim","Vinicius de Moraes","Astrud Gilberto","Nara Leão","Baden Powell","Marcos Valle","Roberto Menescal","Sérgio Mendes","Os Cariocas","Toquinho","Eumir Deodato","Dori Caymmi"],
  "country": ["Johnny Cash","Dolly Parton","Garth Brooks","Shania Twain","Carrie Underwood","Willie Nelson","Luke Bryan","Kacey Musgraves","Blake Shelton","George Strait","Reba McEntire","Hank Williams","Loretta Lynn","Kenny Rogers","Alan Jackson","Tim McGraw","Faith Hill","Keith Urban","Miranda Lambert","Chris Stapleton","Patsy Cline","Merle Haggard","Toby Keith","Jason Aldean","Hunter Hayes","Corb Lund"],
  "clasica": ["Jacques Offenbach","Johann Sebastian Bach","Bach","Wolfgang Amadeus Mozart","Mozart","Ludwig van Beethoven","Beethoven","Pyotr Ilyich Tchaikovsky","Giuseppe Verdi","Verdi","Richard Wagner","Frédéric Chopin","Chopin","Franz Schubert","Antonio Vivaldi","Vivaldi","Johannes Brahms","Claude Debussy","Igor Stravinsky","Sergei Rachmaninoff","Gustav Mahler","Franz Liszt","Robert Schumann","George Frideric Handel","Maurice Ravel","Camille Saint-Saëns","Antonín Dvořák","Dvořák","Gustav Holst","Hector Berlioz","Modest Mussorgsky","Erik Satie","Puccini"],
  "corrido": ["Los Tigres del Norte","Chalino Sánchez","Gerardo Ortiz","El Komander","Alfredo Olivas","Los Alegres de Terán","Valentín Elizalde","Larry Hernández","El Fantasma","Régulo Caro","Adriel Favela","Calibre 50","Pancho Barraza","Saúl 'El Jaguar'","Remmy Valenzuela","Virlan García"],
  "corridosTumbados": ["Peso Pluma","Natanael Cano","Junior H","Fuerza Regida","Gabito Ballesteros","T3R Elemento","Ariel Camacho","Marca Registrada","Tornillo","Oscar Maydon"],
  "cumbia": ["Los Ángeles Azules","La Sonora Dinamita","La Sonora Santanera","Los Palmeras","Ráfaga","Gilda","La Nueva Luna","Los Charros","Karicia","Los Mirlos","Lucho Bermúdez","Pastor López","Antonio Ríos","Selva Negra","Agapornis","Mar Azul","Los Totora","Leo Mattioli","Rodrigo Tapari","La Delio Valdez","Malandro","Ke Personajes","Renzo ED","Elaggume","El Pepo","Angela Leiva","Onda Sabanera","Fer Palacio","Grupo 5","Migrantes","Rombai","Maramá","Grupo Niche","Conjunto Mar Azul","Grupo Green","Grupo Red","Roman El Original","Los Turros","La Kuppé","Los Rancheros"],
  "cumbia420": ["L-Gante","Callejero Fino","Perro Primo","Kaleb Di Masi","DT.Bilardo","Pablo Lescano (colab)","Alan Gomez","La Joaqui","El Noba","Salastkbron","Dj Tao","Bm","Mesita","Keky","Frijo","Zeballos","Ecko","Damas Gratis (feat)","Mágico","TNT"],
  "cumbiaVillera": ["Damas Gratis","Pibes Chorros","Los Pibes Chorros","Yerba Brava","Mala Fama","Meta Guacha","Amar Azul","Supermerk2","Los Gedes","Flor de Piedra","La Base","La Liga","El Empuje","La Champions Liga","Los del Fuego","Agrupación Marilyn","Altos Cumbieros","Los Nota Lokos","El Polaco","Sebastián Mendoza","El Original","Los Peñaloza","Rocío Quiroz","Pablito HC"],
  "cuarteto": ["Carlos 'La Mona' Jiménez","La Mona Jiménez","Rodrigo","Ulises Bueno","La Barra","Damián Córdoba","El Rey Pelusa","Walter Olmos","Banda XXI","El Loco Amato","Sebastián","Tru-la-lá","Chebere","Gary","La Konga","Q' Lokura","Magui Olave","Monada","Jean Carlos","La Fiesta","La T y La M","Luck Ra"],
  "dancehall": ["Sean Paul","Shabba Ranks","Beenie Man","Buju Banton","Vybz Kartel","Bounty Killer","Elephant Man","Gyptian","Konshens","Popcaan","Mr. Vegas","Spice","Aidonia","Agent Sasco","T.O.K.","Cham","Mavado","Serani","Koffee","Alkaline","Sikka Rymes"],
  "deathMetal": ["Cannibal Corpse","Death","Morbid Angel","Obituary","Deicide","Behemoth","Entombed","Nile","Bolt Thrower","Carcass","At the Gates","Arch Enemy","Amon Amarth","Katatonia","Hypocrisy","Malevolent Creation","Suffocation","Dying Fetus","Gorguts","Bloodbath","Gojira"],
  "dembow": ["El Alfa","Chimbala","Tokischa","Rochy RD","Yailin la Mas Viral"],
  "disco": ["Bee Gees","Donna Summer","Gloria Gaynor","KC and the Sunshine Band","Village People","Sylvester","The Trammps","ABBA","Sister Sledge","Boney M.","The Jacksons","Hot Chocolate","Amii Stewart","Evelyn 'Champagne' King","Tavares","Patrick Hernandez","The Emotions","Scissor Sisters"],
  "drill": ["Pop Smoke","Central Cee","Headie One","Unknown T","Skepta","Digga D","Gazo","Fredo","Abra Cadabra","Dutchavelli","M1llionz","Loski","LD","21 Savage (influencias)","Lil Durk","Chief Keef","Fivio Foreign","Sheff G","Dusty Locane","King Von","Smoke"],
  "dubstep": ["Skrillex","Rusko","Excision","Zomboy","Flux Pavilion","Benga","Skream","Doctor P","Knife Party","Virtual Riot","Datsik","Nero","Zeds Dead","Bassnectar","Eptic","Barely Alive","Trampa","Space Laces","Downlink","Snails"],
  "drumAndBass": ["Goldie","Goldie presents Rufige Kru","Roni Size","Andy C","Noisia","Pendulum","High Contrast","LTJ Bukem","Sub Focus","Netsky","Chase & Status","DJ Hype","Bad Company UK","Calyx & Teebee","Logistics","Danny Byrd","Dimension","Friction","Alix Perez","Break","S.P.Y"],
  "edm": ["Subtronics","KSHMR","DJ Snake","Pitbull"],
  "electronic": ["The Chemical Brothers","Kraftwerk","Aphex Twin","Underworld","Moby","Boards of Canada","Fatboy Slim","The Prodigy","Orbital","Röyksopp","Justice","Caribou","Bonobo","Four Tet","Jon Hopkins","Burial","Jamie xx","Moderat","Nicolas Jaar"],
  "edmActual": ["Martin Garrix","Marshmello","The Chainsmokers","Alan Walker","Zedd","Kygo","Illenium","Madeon","Porter Robinson","Steve Aoki","Hardwell","Oliver Heldens","Alesso","Afrojack","Don Diablo","Dimitri Vegas & Like Mike","Peggy Gou","Diplo","Mark Ronson"],
  "electronicaArgentina": ["Hernán Cattáneo","Peces Raros","Tremor","Javier Zuker","Ignacia","Chancha Vía Circuito","Jonas Kopp","Barem","Dilo","Mariano Mellino","Tomas Heredia","Sofia Kourtesis","Villa Diamante","DJ Barda","Villa Victoria","Matias Bagato","Francisca Lopez Miller","Lucefora","Jay de Lys","Javier Bussola","Eli Kaplun","Santiago Niño"],
  "flamenco": ["Paco de Lucía","Camarón de la Isla","El Camarón de la Isla","Camaron","Vicente Amigo","Tomatito","Niño Josele","Diego el Cigala","Niña Pastori","Enrique Morente"],
  "folk": ["Bob Dylan","Joan Baez","Simon & Garfunkel","Woody Guthrie","Neil Young","Cat Stevens","Joni Mitchell","Leonard Cohen","Peter, Paul and Mary","Nick Drake","Fairport Convention","The Byrds","Crosby, Stills & Nash","Donovan","James Taylor","Gordon Lightfoot","Odetta","Sufjan Stevens","Fleet Foxes","Iron & Wine","Tracy Chapman","Pete Seeger"],
  "folkloreArgentino": ["Atahualpa Yupanqui","Mercedes Sosa","Los Chalchaleros","Los Fronterizos","Horacio Guarany","Los Nocheros","Chaqueño Palavecino","Soledad Pastorutti","Abel Pintos","Peteco Carabajal","Los Carabajal","Ramona Galarza","Los Tekis","Jorge Rojas","Los Tucu Tucu","Lucía Ceresani","Raly Barrionuevo","Dúo Coplanacu","Los Huayra","Tamara Castro","José Luis Aguirre","Nadia Larcher","Nahuel Pennisi","Arbolito","Don Olimpio","Los Manseros Santiagueños","Luciano Pereyra"],
  "folkloreColombia": ["Totó la Momposina","Petrona Martínez","Rafael Escalona","Delia Zapata Olivella","La Negra Grande de Colombia","Los Gaiteros de San Jacinto","ChocQuibTown","María Mulata","Gregorio Uribe","Leonor González Mina","Grupo Bahía","Las Alegres Ambulancias","Lisandro Meza","Aniceto Molina","Viviana Posada","Catagón de Timbiquí","Alfredo Gutiérrez","Orlando y Gabriel","Los Corraleros de Majagual","Juan Carlos Coronel"],
  "funkRap": ["Illya Kuryaki & the Valderramas","Emmanuel Horvilleur","Jugo","Lo Pibitos","Anderson .Paak","Childish Gambino","Mac Miller","Chance the Rapper","A Tribe Called Quest","The Roots","Dr. Dre","Warren G","Nate Dogg","DJ Quik","Faith No More","Living Colour"],
  "funk": ["Parliament-Funkadelic","Funkadelic","Parliament","Sly & The Family Stone","Rick James","Earth, Wind & Fire","Kool & The Gang","Tower of Power","George Clinton","Bootsy Collins","The Meters","Cameo","The Gap Band","Ohio Players","Larry Graham","Average White Band","War","Zapp","Shuggie Otis"],
  "glamMetal": ["Mötley Crüe","Poison","Def Leppard","Twisted Sister","Cinderella","Ratt","Warrant","Skid Row","Quiet Riot","Great White"],
  "glamRock": ["David Bowie","T. Rex","Roxy Music","Slade","Sweet","Gary Glitter","New York Dolls","Mott the Hoople","Suzi Quatro","Mud"],
  "gospel": ["Mahalia Jackson","Kirk Franklin","Sister Rosetta Tharpe","Yolanda Adams","Donnie McClurkin","CeCe Winans","Mary Mary","Tasha Cobbs Leonard","Richard Smallwood","Smokie Norful","Shirley Caesar","James Cleveland","Andraé Crouch","Mavis Staples","Travis Greene","Israel Houghton","Fred Hammond","The Clark Sisters","Tamela Mann","Kirk Franklin Donald Malloy"],
  "grunge": ["Nirvana","Pearl Jam","Soundgarden","Alice in Chains","Stone Temple Pilots","Mudhoney","Screaming Trees","Temple of the Dog","Mother Love Bone","Bush","Silverchair","Hole","L7","Babes in Toyland","Melvins"],
  "hardcorePunk": ["Minor Threat","Bad Brains","Agnostic Front","Circle Jerks","Madball","Gorilla Biscuits"],
  "heavyMetal": ["Iron Maiden","Judas Priest","Black Sabbath","Helloween","Manowar","Saxon","Accept","Van Halen","Whitesnake","Dio","Motörhead","Scorpions","Metal Church","Yngwie Malmsteen","Stratovarius","Gamma Ray","Iced Earth","Primal Fear","DragonForce","Nightwish","Slipknot","MESHUGGAH","Sabaton","Ratos de Porão","Mudvayne"],
  "heavyMetalArgentino": ["Rata Blanca","Hermética","Almafuerte","V8","Horcas","Malón","Logos","A.N.I.M.A.L.","O'Connor","Lethal"],
  "heavyMetalLatino": ["Kraken","Ángeles del Infierno","Mägo de Oz","Resorte","Transmetal","Luzbel","Barón Rojo","Brujería","Angra"],
  "hiphop": ["Kendrick Lamar","Drake","J. Cole","Jay-Z","Kanye West","Nicki Minaj","Cardi B","Wu-Tang Clan","Big Daddy Kane","Ice-T","EPMD","MC Hammer","Tyler, The Creator","A$AP Rocky","Run-DMC","LL Cool J","Rakim","Public Enemy","Outkast","N.W.A.","Lil Wayne","50 Cent","ASD","Afrob","Samy Deluxe","Grandmaster Flash","DJ Khaled","Xavier Wulf","Mr. Pookie","Zach Mc Phee","Control Machete"],
  "highlife": ["E.T. Mensah","Osibisa","Chief Stephen Osita Osadebe","Victor Olaiya","Nana Ampadu","King Sunny Adé (jujú/highlife fusión)","Félá Ransome-Kuti (temprano)","Daddy Lumba","Amakye Dede","Gyedu-Blay Ambolley","Prince Nico Mbarga","Pat Thomas","Fatawu Amadu","Rex Lawson","A.B. Crentsil","Alex Konadu","Sir Victor Uwaifo","Oliver De Coque","Flavour N'abania","Chief Shina Peters"],
  "house": ["Frankie Knuckles","David Guetta","Calvin Harris","Avicii","Swedish House Mafia","Daft Punk","Deadmau5","Eric Prydz","Kaskade","Disclosure","Armand van Helden","Todd Terry","Masters at Work","Cassius","Bob Sinclar","Robin S.","Roger Sanchez","MK (Marc Kinchen)","Duke Dumont","Claptone"],
  "hyperpop": ["100 gecs","Charli XCX","Sophie","Glaive","Dorian Electra","Rina Sawayama","Arca","Midwxst","Osquinn","Food House","Black Dresses","Ericdoa","Alice Longyu Gao","Fraxiom","Quin","Brakence","Ecco2k","Bladee","Yameii Online","Underscores"],
  "indieRock": ["The Strokes","Vampire Weekend","The National","Kings of Leon","Tame Impala","The White Stripes","Yeah Yeah Yeahs","MGMT","Modest Mouse","The Libertines","Arcade Fire","Phoenix","Two Door Cinema Club","Bloc Party","Foals","The Shins","The Kooks","Death Cab for Cutie","The War on Drugs","Vance Joy","Wet Leg","Cigarettes After Sex","Ed Maverick"],
  "industrialMetal": ["Rammstein","Nine Inch Nails","Ministry","Static-X","Fear Factory","KMFDM","Marilyn Manson","Rob Zombie","White Zombie","Godflesh","Dope","Orgy","Powerman 5000","Pitchshifter","Prong","Skinny Puppy","Oomph!","Stabbing Westward","Celldweller","Filter","Gravity Kills"],
  "infantil": ["Canticuénticos","Magdalena Fleitas","Los Raviolis","Pim Pau","Topa","Diego Topa","Plim Plim","El Payaso Plim Plim","Leoncito Alado","Ocho Monitos Canciones Infantiles","A Ram Sam Sam Canciones Infantiles","Un Piojito Canciones Infantiles","Veo Veo Canciones Infantiles","A Bañarme Canciones Infantiles","El Cangrejo No Es Un Pez Canciones Infantiles","Xuxa"],
  "instrumental": ["Pablo Agri","Hilda Herrera","Franco Luciani","Daniel Maza","Manu Sija","Lindsey Stirling","Joe Satriani","Steve Vai","Hans Zimmer","Liquid Tension Experiment","Eric Johnson","2Cellos","Santo & Johnny","Paul Gilbert","Plini","Polyphia","Intervals","Explosions in the Sky","Yanni","Ólafur Arnalds","John Williams","Ludovico Einaudi","Mason Williams","Richard Clayderman","Godspeed You! Black Emperor"],
  "jazz": ["Miles Davis","John Coltrane","Louis Armstrong","Duke Ellington","Duke Ellington Orchestra","Duke Ellington and His Famous Orchestra","Ella Fitzgerald","Charlie Parker","Billie Holiday","Thelonious Monk","Herbie Hancock","Chet Baker","Sarah Vaughan","Sonny Rollins","Charles Mingus","Dizzy Gillespie","Stan Getz","Wynton Marsalis","Ornette Coleman","Chick Corea","Pat Metheny","Esperanza Spalding","Crazy Macayas Trio","Frank Sinatra","Roxana Amed","Yamile Burich","Hernán Jacinto","Ricardo Lew","Ligia Piro","ARGENTUM Jazz Quinteto","Bourbon Sweethearts","Escalandrum","Swing Summit Trío","Trío Sin Tiempo","Oscar Peterson","Gene Chandler"],
  "jpop": ["Hikaru Utada","Perfume","Arashi","Kyary Pamyu Pamyu","Babymetal","Namie Amuro","Ayumi Hamasaki","Morning Musume","X Japan","B'z","L'Arc~en~Ciel","AKB48","King & Prince","Nogizaka46","Gen Hoshino","Ken Hirai","One Ok Rock","RADWIMPS","Mr. Children","SEKAI NO OWARI","Fujii Kaze"],
  "kpop": ["BTS","BLACKPINK","EXO","TWICE","Red Velvet","Stray Kids","SEVENTEEN","NCT 127","NCT DREAM","ITZY","AESPA","GOT7","TXT","BigBang","Girls' Generation","Super Junior","2NE1","SHINee","LE SSERAFIM","NewJeans","IVE","NAYEON","JYP Entertainment"],
  "latinIndie": ["Zoé","Porter","Siddhartha","Bomba Estéreo","Carla Morrison","Mon Laferte","Hello Seahorse!","Los Amigos Invisibles","El Mató a un Policía Motorizado","Gepe","Dënver","Natalia Lafourcade","Pezcuis","Ainda","Bandalos Chinos","Ca7riel y Paco Amoroso","Feli Colina","Dillom","Ximena Sariñana"],
  "lofi": ["Nujabes","J Dilla","Tomppabeats","Idealism","Joakim Karud","SwuM","Jinsang","L'indécis","FloFilz","Philanthrope","Chillhop Essentials","Saib","Kudasai","Birocratic","Kream","Konteks","Leavv","Aso","Yasper","Oatmello"],
  "mariachi": ["José Alfredo Jiménez","Pedro Infante","Alejandro Fernández","Aida Cuevas","Lucha Villa","Flor Silvestre","Antonio Aguilar","Pepe Aguilar","Amalia Mendoza","Juan Valentín","Mariachi Vargas de Tecalitlán","Mariachi Sol de México","Mariachi Cobre","Christian Nodal","Lucero","Lupita D'Alessio"],
  "merengue": ["Juan Luis Guerra","Johnny Ventura","Sergio Vargas","Milly Quezada","Eddy Herrera","Wilfrido Vargas","Toño Rosario","Elvis Crespo","Omega","Jandy Ventura","Hermanos Rosario","Bonny Cepeda","Kinito Méndez","Rubby Pérez","Rikarena","Fernando Villalona","Miriam Cruz","Pochy Familia","Krisspy","Los Ilegales"],
  "musicaBrasilera": ["Caetano Veloso","Gilberto Gil","Gal Costa","Chico Buarque","Elis Regina","Milton Nascimento","Jorge Ben Jor","Tom Jobim","Djavan","Maria Bethânia","Ivete Sangalo","Marisa Monte","Seu Jorge","Legião Urbana","Os Mutantes","Anitta","Rita Lee","Robinio Mundibu"],
  "newWave": ["Duran Duran","A-ha","Tears for Fears","Eurythmics","INXS","Simple Minds","Talking Heads","The B-52's","The Human League","Ultravox","Joy Division","Evelyn King"],
  "norteno": ["Ramón Ayala","Los Tucanes de Tijuana","Intocable","Los Huracanes del Norte","Pesado","Bronco","Los Rieleros del Norte","La Maquinaria Norteña","Los Invasores de NL","Los Cadetes de Linares","Los Traileros del Norte","Fito Olivares","La Fiera de Ojinaga","Los Tremendos Gavilanes","Cardenales de NL","Grupo Frontera","Los Temerarios","Duelo","Tigres del Norte (temprano)","Conjunto Primavera"],
  "opera": ["Luciano Pavarotti","Maria Callas","Plácido Domingo","Montserrat Caballé","Andrea Bocelli","Renée Fleming","Jonas Kaufmann","Anna Netrebko","José Carreras","Cecilia Bartoli","Kiri Te Kanawa","Dmitri Hvorostovsky","Bryn Terfel","Jessye Norman","Joan Sutherland","Renata Tebaldi","Franco Corelli","Nicolai Gedda","Elīna Garanča","Piotr Beczała"],
  "pop": ["Michael Jackson","Madonna","Prince","Whitney Houston","Mariah Carey","Janet Jackson","Taylor Swift","Dua Lipa","Ariana Grande","Katy Perry","Lady Gaga","Britney Spears","Christina Aguilera","Ed Sheeran","Bruno Mars","Justin Bieber","Selena Gomez","Shawn Mendes","Billie Eilish","Harry Styles","Olivia Rodrigo","Miranda!","Benny Blanco","Sabrina Carpenter","Post Malone","Doja Cat","Bandana","Adele","Crazy Frog","Seal","The Beach Boys","Lana Del Rey","Björk","Sam Smith","Zoe Gotusso","El Kuelgue","Usted Señálemelo","Denise Rosenthal","Francisca Valenzuela","Violette Wautier","Maroon 5","Lizzo","La Oreja de Van Gogh","Fergie","The Black Eyed Peas","Las Ketchup","Loreen","Troye Sivan","Jonas Brothers","Teddy Swims"],
  "pop90s": ["Spice Girls","Backstreet Boys","NSYNC","Jennifer Lopez","Cyndi Lauper","George Michael","Destiny's Child","Hanson"],
  "popLatinoActual": ["Sebastián Yatra","Morat","Kany García","Carlos Rivera","Sin Bandera","Jesse & Joy","Camilo","Anahí","Maite Perroni","Samo","Leonel García","Fanny Lu","Sharon Corr (colab latinas)","Valentino Merlo","CNCO","Piso 21","Greeicy","Gloria Trevi","Pedro Capó","Alex Ubago","Axel","Danny Ocean","Alvaro Soler"],
  "popLatinoClasico": ["Luis Miguel","Ricky Martin","Gloria Estefan","Enrique Iglesias","Thalía","Paulina Rubio","Ricardo Arjona","Belinda","Reik","Ha*Ash","Camila","Fey","Kabah","OV7","Paty Cantú","Mecano","Hombres G","Vanessa Martín","Coti","Amaia Montero","Rosana","Ednita Nazario","Miguel Bosé","RBD"],
  "popPunk": ["Blink-182","Paramore","My Chemical Romance","Sum 41","Avril Lavigne","Fall Out Boy","Good Charlotte","Simple Plan","All Time Low","New Found Glory","Jimmy Eat World","Saves The Day","Bowling For Soup","Neck Deep","The Wonder Years","State Champs"],
  "progressiveRock": ["Pink Floyd","Genesis","Yes","King Crimson","Rush","Dream Theater","ELP","Jethro Tull","Camel","Marillion","Porcupine Tree","Gentle Giant","Kansas","Transatlantic","Arena","IQ","Asia","Opeth","Neal Morse Band","Steven Wilson"],
  "punk": ["Ramones","Sex Pistols","The Sex Pistols","The Clash","Dead Kennedys","Misfits","Buzzcocks","The Damned","Black Flag","Bad Religion","Descendents","NOFX","Rancid","Green Day","The Offspring","Pennywise","Anti-Flag","Dropkick Murphys","The Exploited","Lagwagon","Fugazi"],
  "ranchera": ["Vicente Fernández","Chavela Vargas","Cuco Sánchez","Jorge Negrete","Lola Beltrán","Pedro Fernández","Joan Sebastian"],
  "rap": ["Eminem","Nas","Tupac","The Notorious B.I.G.","Ice Cube","Snoop Dogg","Big L","DMX","Busta Rhymes","Big Pun","KRS-One","Tech N9ne","Killer Mike","Mos Def","Emanero","Nuco","Charlie Ray","Twisted Insane","2Pac"],
  "rb": ["Beyoncé","Rihanna","Usher","Alicia Keys","The Weeknd","Chris Brown","Mary J. Blige","SZA","Frank Ocean","Miguel","Ne-Yo","Trey Songz","Ciara","Brandy","Monica","Toni Braxton","Boyz II Men","Tyrese","Janelle Monáe","H.E.R.","Gnarls Barkley","Jesse Baez","Daniel Caesar","Estelle","Brent Faiyaz"],
  "reggae": ["Bob Marley","Peter Tosh","Jimmy Cliff","Burning Spear","Toots & The Maytals","Ziggy Marley","Damian Marley","Gregory Isaacs","Steel Pulse","Black Uhuru","Dennis Brown","Chronixx","Protoje","Alborosie","Capleton","Yellowman","Sizzla"],
  "reggaeton": ["Daddy Yankee","Luis Fonsi","J Balvin","Karol G","Ozuna","Nicky Jam","Maluma","Feid","Rauw Alejandro","Anuel AA","Wisin & Yandel","Chencho Corleone","Ivy Queen","Don Omar","Farruko","Arcángel","De La Ghetto","Sech","Bryant Myers","Lunay","Tego Calderón","Gordo","Darell"],
  "rock": ["The Beatles","The Rolling Stones","Led Zeppelin","KISS","Santana","Creedence Clearwater Revival","Queen","The Who","AC/DC","Guns N' Roses","Aerosmith","U2","The Doors","Deep Purple","Bon Jovi","Jon Bon Jovi","The Police","Dire Straits","Chuck Berry","Little Richard","Buddy Holly","Elvis Presley","The Kinks","Van Morrison","Janis Joplin","Stevie Nicks","Alex Angel","Alanis Morissette"],
  "rockArgentino": ["Soda Stereo","Charly García","Luis Alberto Spinetta","Fito Páez","Patricio Rey y sus Redonditos de Ricota","Los Redondos","Andrés Calamaro","Los Fabulosos Cadillacs","Divididos","Babasónicos","Los Auténticos Decadentes","Los Pericos","La Renga","Bersuit Vergarabat","Los Enanitos Verdes","Virus","Sumo","Los Tipitos","Catupecu Machu","Attaque 77","León Gieco","Pedro Aznar","David Lebón","Serú Girán","Los Abuelos de la Nada","Ratones Paranoicos","Todos Tus Muertos","Kapanga","Massacre","Carajo","Árbol","Eterna Inocencia","Gustavo Cerati","Eruca Sativa","Los Espíritus","Hilda Lizarazu","Marilina Bertoldi","Conociendo Rusia","Los Piojos","Almendra","Pappo","Vox Dei","Color Humano","Billy Bond","Invisible","Manal","Arco Iris","Superuva","Sui Generis","Estelares","Dante Spinetta","Gustavo Cordera","Mancha de Rolando","Sueños Innatos","Flema","Flemita","Las Pelotas","Indios","Indio Solari","El Cuarteto de Nos","Willy Quiroga","Willy Quiroga Vox Dei","La Mancha de Rolando","Tipitos","Ricky Espinosa","Marilina"],
  "rockLatino": ["Maná","Caifanes","Molotov","Héroes del Silencio","Aterciopelados","Los Prisioneros","Café Tacuba","Café Tacvba","La Ley","Los Bunkers","La Vela Puerca","Plastilina Mosh","Beret","Julieta Venegas","Bunbury","Enrique Bunbury","Juanes","Gustavo Santaolalla"],
  "salsa": ["Celia Cruz","Héctor Lavoe","Rubén Blades","Marc Anthony","Willie Colón","Oscar D'León","Tito Puente","Johnny Pacheco","Ismael Rivera","Ray Barretto","Cheo Feliciano","Eddie Palmieri","Larry Harlow","Pete 'El Conde' Rodríguez","Pete Rodríguez","Adalberto Santiago","Charlie Palmieri","Frankie Ruiz","La India","Víctor Manuelle","Gilberto Santa Rosa","El Gran Combo de Puerto Rico"],
  "sambaPagode": ["Cartola","Noel Rosa","Zeca Pagodinho","Beth Carvalho","Clara Nunes","Paulinho da Viola","Martinho da Vila","Fundo de Quintal","Jorge Aragão","Alcione","Arlindo Cruz","Dudu Nobre","Pixinguinha","Nelson Cavaquinho","Bezerra da Silva","Grupo Revelación","Exaltasamba","Só Pra Contrariar","Raça Negra","Turma do Pagode"],
  "ska": ["The Specials","Madness","Desmond Dekker","The Skatalites","The Selecter","Bad Manners","Hepcat","The Toasters","Reel Big Fish","Less Than Jake","The Mighty Mighty Bosstones","The Slackers","Operation Ivy","Streetlight Manifesto","Fishbone","Prince Buster","Laurel Aitken","Alton Ellis","Eastern Standard Time","La Mosca"],
  "sertanejo": ["Luan Santana","Gusttavo Lima","Marília Mendonça","Jorge & Mateus","Paula Fernandes","Henrique & Juliano","Ana Castela","Zé Neto & Cristiano","Matheus & Kauan","Simone Mendes","Luan Pereira","Zé Felipe","Diego & Victor Hugo","Bruno & Marrone","Gustavo Mioto","Maiara & Maraisa","Victor & Leo","Zezé Di Camargo & Luciano","Lauana Prado","Marcos & Belutti","Eduardo Costa"],
  "softRock": ["Eagles","Fleetwood Mac","Boston","Chicago","America","Styx","Supertramp","Toto","Phil Collins","Lionel Richie","Journey","REO Speedwagon","Elton John","The Eagles"],
  "soul": ["Aretha Franklin","Otis Redding","Marvin Gaye","Stevie Wonder","Ray Charles","Sam Cooke","Smokey Robinson","Al Green","Curtis Mayfield","Gladys Knight","The Temptations","Diana Ross","Tina Turner","James Brown","Isaac Hayes","Barry White","Solomon Burke","Patti LaBelle","Donny Hathaway","Erykah Badu","The Supremes","Amy Winehouse","John Legend"],
  "synthpop": ["Depeche Mode","Pet Shop Boys","New Order","CHVRCHES","Grimes","Erasure","Owl City","La Roux","Empire of the Sun","M83"],
  "tango": ["Carlos Gardel","Astor Piazzolla","Aníbal Troilo","Anibal Troilo Pichuco","Osvaldo Pugliese","Juan D'Arienzo","Roberto Goyeneche","Edmundo Rivero","Horacio Salgán","Mercedes Simone","Francisco Canaro","Nelly Omar","Hugo del Carril","Adolfo Carabelli","Enrique Santos Discépolo","Julio Sosa","Adriana Varela","Susana Rinaldi","Jorge Sobral","Leopoldo Federico","Orquesta Típica Fernández Fierro","Mariano Mores","Lidia Borda","Juan 'Tata' Cedrón","José Colángelo","Julieta Laso","Hugo Rivas","Diego Schissi Quinteto","Nicolás Ledesma Orquesta","Orquesta del Tango de Buenos Aires","Quinteto Lumière","Trío Lavallén-Estigarribia-Cabarcos","Quintet Argentum"],
  "techno": ["Carl Cox","Jeff Mills","Richie Hawtin","Adam Beyer","Charlotte de Witte","Amelie Lens","Sven Väth","Laurent Garnier","Nina Kraviz","Derrick May","Juan Atkins","Kevin Saunderson","Len Faki","Ben Klock","Marcel Dettmann","Dave Clarke","Green Velvet","Dubfire","Chris Liebing","Joseph Capriati","Miss Monique"],
  "thrashMetal": ["Metallica","Slayer","Megadeth","Anthrax","Exodus","Testament","Machine Head","Overkill","Sepultura","Kreator","Sodom","Destruction","Vio-Lence","Havok","Heathen","Annihilator","Death Angel","Forbidden","Municipal Waste","Tankard","Sacred Reich","Lost Society","Pantera"],
  "trance": ["Armin van Buuren","Paul van Dyk","Tiesto","Ferry Corsten","Above & Beyond","ATB","Dash Berlin","Aly & Fila","Cosmic Gate","Paul Oakenfold","BT","Gareth Emery","Markus Schulz","Giuseppe Ottaviani","Andrew Rayel","MaRLo","Orjan Nilsen","Lange","Johan Gielen","Sander van Doorn"],
  "trovaCubana": ["Silvio Rodríguez","Pablo Milanés","Noel Nicola","Sara González","Vicente Feliú","Amaury Pérez","Frank Delgado","Carlos Varela","Gerardo Alfonso","Santiago Feliú","Liuba María Hevia","Polito Ibáñez","Kelvis Ochoa","Tony Ávila","Pedro Luis Ferrer","Carlos Mejía Godoy","Vicentico Valdés","Virulo","Marta Campos","Karel García"],
  "trap": ["Travis Scott","Future","Migos","Lil Baby","21 Savage","Young Thug","Playboi Carti","Lil Uzi Vert","Offset","Kodak Black","Roddy Ricch","DaBaby","Don Toliver","Ski Mask the Slump God","Gunna","NAV","Trippie Redd","YBN Nahmir","Trophyyy Boyyy"],
  "trapArgentino": ["Duki","Bizarrap","YSY A","Cazzu","Nicki Nicole","Trueno","Khea","Tiago PZK","Neo Pistea","Lit Killah","Paulo Londra","Papo MC","Replik","Wos","FMK","Rusherking","Seven Kayne","C.R.O","Bhavi","Milo J"],
  "urbanoLatino": ["Mora","Myke Towers","Becky G","Young Miko","María Becerra","Rels B","Lali","Tini","Micro TDH","Nathy Peluso","Jhayco","Kali Uchis","Big One","Gente de Zona","Manuel Turizo","Kevvo","Quevedo","Shakira","ROSALÍA","Emilia","Villano Antillano","Zaramay"],
  "vallenato": ["Diomedes Díaz","Carlos Vives","Silvestre Dangond","Jorge Celedón","Rafael Orozco","Fonseca","Binomio de Oro","Los Hermanos Zuleta","Jorge Oñate","Los Gigantes del Vallenato","Los Betos","Los Diablitos","Los Inquietos","Otto Serge & Rafael Ricardo","Rafael Orozco Maestre","Miguel Morales","Los Embajadores Vallenatos","Ivan Villazón","Beto Villa","Juancho Rois","Peter Manjarrés","Kaleth Morales"]
};




// Géneros adicionales y búsquedas complementarias
const year = new Date().getFullYear();

const genericQueries = [
  // Buckets globales
  { query: `top global hits ${year} "official video" -live -cover -karaoke -lyrics -full album`, maxResults: 18, genre: "pop" },
  { query: `trending music ${year} "official video" -live -cover -karaoke -lyrics -full album`, maxResults: 15, genre: "pop" },
  { query: `viral songs ${year} "official video" -live -cover -karaoke -lyrics -full album`, maxResults: 15, genre: "pop" },

  // Pop / Urbano / Trap
  { query: `pop hits ${year} "official video" -live -cover -karaoke -lyrics -full album`, maxResults: 15, genre: "pop" },
  { query: `reggaeton ${year} "official video" -live -cover -karaoke -lyrics -full album`, maxResults: 15, genre: "reggaeton" },
  { query: `urbano latino ${year} "official video" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "urbanoLatino" },
  { query: `trap hits ${year} "official video" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "trap" },
  { query: `pop latino ${year} "official video" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "popLatinoActual" },

  // Rock y alternativos
  { query: `rock classics "audio" -live -cover -karaoke -lyrics -full album -remix`, maxResults: 12, genre: "rock" },
  { query: `alternative rock ${year} "official video" -live -cover -karaoke -lyrics -full album`, maxResults: 10, genre: "alternativeRock" },
  { query: `indie rock ${year} "official video" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "indieRock" },
  { query: `grunge 90s "audio" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "grunge" },
  { query: `new wave 80s "audio" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "newWave" },
  { query: `glam metal 80s "audio" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "glamMetal" },
  { query: `pop 90s hits "official video" -live -cover -karaoke -lyrics -full album`, maxResults: 15, genre: "pop90s" },

  // Hip hop / R&B
  { query: `hip hop ${year} "official video" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "hiphop" },
  { query: `r&b hits ${year} "official video" -live -cover -karaoke -lyrics -full album`, maxResults: 10, genre: "rb" },
  { query: `drill ${year} "official video" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "drill" },

  // Electrónica (permitimos remix)
  { query: `edm ${year} "official video" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "edmActual" },
  { query: `house music ${year} "official video" remix`, maxResults: 12, genre: "house" },
  { query: `techno ${year} "official video" -live -full album`, maxResults: 12, genre: "techno" }, // liveset sí
  { query: `trance anthems "official video" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "trance" },
  { query: `drum and bass mix ${year}`, maxResults: 12, genre: "drumAndBass" },
  { query: `dubstep drops ${year} "official video" remix`, maxResults: 12, genre: "dubstep" },
  { query: `synthpop essentials "audio" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "synthpop" },

  // Latinos regionales
  { query: `corridos tumbados ${year} "official video" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "corridosTumbados" },
  { query: `salsa clásicos "audio" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "salsa" },
  { query: `merengue clásicos "audio" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "merengue" },
  { query: `bachata romántica "audio" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "bachata" },
  { query: `cumbia villera hits "audio" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "cumbiaVillera" },

  // Argentina / Brasil / Cuba
  { query: `rock nacional argentino clásicos "audio" -live -cover -karaoke -lyrics -full album`, maxResults: 15, genre: "rockArgentino" },
  { query: `folklore argentino clásicos "audio" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "folkloreArgentino" },
  { query: `cumbia 420 ${year} "official video" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "cumbia420" },
  { query: `trap argentino ${year} "official video" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "trapArgentino" },
  { query: `bossa nova essentials "audio" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "bossaNova" },
  { query: `samba pagode hits "official video" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "sambaPagode" },
  { query: `trova cubana clásicos "audio" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "trovaCubana" },
  { query: `latin indie playlist "official video" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "latinIndie" },

  // África / Asia
  { query: `afrobeat hits ${year} "official video" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "afrobeat" },
  { query: `kpop hits ${year} "official video"`, maxResults: 12, genre: "kpop" },
  { query: `jpop hits ${year} "official video"`, maxResults: 12, genre: "jpop" },

  // Clásicos no-latinos
  { query: `jazz classics "audio" -live -cover -karaoke -lyrics -full album -remix`, maxResults: 12, genre: "jazz" },
  { query: `soul music playlist "audio" -live -cover -karaoke -lyrics -full album`, maxResults: 10, genre: "soul" },
  { query: `funk greatest hits "audio" -live -cover -karaoke -lyrics -full album`, maxResults: 10, genre: "funk" },
  { query: `reggae best songs "audio" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "reggae" },
  { query: `ska classics "audio" -live -cover -karaoke -lyrics -full album`, maxResults: 10, genre: "ska" },

  // Metal y punk (sin remix y sin live)
  { query: `heavy metal classics "audio" -live -cover -karaoke -lyrics -full album -remix`, maxResults: 12, genre: "heavyMetal" },
  { query: `thrash metal playlist "audio" -live -cover -karaoke -lyrics -full album -remix`, maxResults: 12, genre: "thrashMetal" },
  { query: `black metal playlist "audio" -live -cover -karaoke -lyrics -full album -remix`, maxResults: 10, genre: "blackMetal" },
  { query: `death metal classics "audio" -live -cover -karaoke -lyrics -full album -remix`, maxResults: 10, genre: "deathMetal" },
  { query: `punk rock 90s "audio" -live -cover -karaoke -lyrics -full album -remix`, maxResults: 12, genre: "punk" },
  { query: `hardcore punk "audio" -live -cover -karaoke -lyrics -full album -remix`, maxResults: 10, genre: "hardcorePunk" },

  // Otros
  { query: `opera arias "audio" -live -cover -karaoke -lyrics -full album`, maxResults: 10, genre: "opera" },
  { query: `baladas románticas "audio" -live -cover -karaoke -lyrics -full album`, maxResults: 12, genre: "balada" }
];

module.exports = {
  artistsByGenre,
  genericQueries
};