// Base de datos de artistas organizados por género
// Archivo separado para facilitar mantenimiento y actualizaciones

const artistsByGenre = {
  "afrobeat": ["Fela Kuti","Tony Allen","Burna Boy","Wizkid","Davido","Seun Kuti","Femi Kuti","Mr Eazi","Yemi Alade","Tiwa Savage","Rema","Tems","CKay","Fireboy DML","Olamide","P-Square","Kizz Daniel","Ayra Starr","Tekno","Joeboy"],
  "alternativeRock": ["Radiohead","Red Hot Chili Peppers","Arctic Monkeys","Coldplay","The Killers","Pixies","Sonic Youth","The Verve","Muse","Oasis","Blur","The Smashing Pumpkins","R.E.M.","Beck","Placebo","Interpol","Kasabian","Franz Ferdinand","Foo Fighters","Queens of the Stone Age","The Cure","Nick Cave & The Bad Seeds","Florence + The Machine","Live","Collective Soul","Everclear"],
  "bachata": ["Romeo Santos","Aventura","Prince Royce","Juan Luis Guerra","Zacarías Ferreira","Joe Veras","Antony Santos","Frank Reyes","Luis Vargas","Andy Andy","Yoskar Sarante","El Torito (Héctor Acosta)","Kiko Rodríguez","Monchy & Alexandra","Teodoro Reyes","Raulín Rodríguez","Ramón Cordero","Leonardo Paniagua","Blas Durán","Grupo Extra"],
  "balada": ["José José","Rocío Dúrcal","Camilo Sesto","Juan Gabriel","Cristian Castro","Luis Fonsi","Laura Pausini","Alejandro Sanz","Ana Gabriel","Ricardo Montaner","Vicente Fernández (baladas)","Yuri","Mijares","Chayanne","Emmanuel","Sandro","Myriam Hernández","Pablo Alborán","David Bisbal","Carlos Rivera"],
  "blackMetal": ["Mayhem","Burzum","Emperor","Darkthrone","Immortal","Gorgoroth","Enslaved","Satyricon","Bathory","Carpathian Forest","Marduk","Dissection","1349","Watain","Dimmu Borgir","Naglfar","Taake","Ulver","Borknagar","Beherit"],
  "bluegrass": ["Bill Monroe","Earl Scruggs","Ricky Skaggs","Alison Krauss","Flatt & Scruggs","Del McCoury","Tony Rice","Sam Bush","The Stanley Brothers","Doc Watson","Béla Fleck","JD Crowe","Rhonda Vincent","Chris Thile","Punch Brothers","Doyle Lawson","Blue Highway","Mountain Heart","Larry Sparks","Dailey & Vincent"],
  "bolero": ["Luis Miguel","Trío Los Panchos","Armando Manzanero","Antonio Machín","José Feliciano","Lucho Gatica","Julio Jaramillo","Los Tres Reyes","Daniel Santos","Olga Guillot","Marco Antonio Muñiz","Bienvenido Granda","Alfredo Sadel","Alberto Cortez","Pablo Milanés","Vicente Garrido","Chavela Vargas","Eydie Gormé","Bobby Capó","Ibrahim Ferrer"],
  "bossaNova": ["João Gilberto","Antonio Carlos Jobim","Vinicius de Moraes","Stan Getz","Astrud Gilberto","Gal Costa","Nara Leão","Baden Powell","Elis Regina","Marcos Valle","Roberto Menescal","Sérgio Mendes","Os Cariocas","Toquinho","Milton Nascimento","Eumir Deodato","Gilberto Gil","Caetano Veloso","Dori Caymmi","Chico Buarque"],
  "country": ["Johnny Cash","Dolly Parton","Garth Brooks","Shania Twain","Carrie Underwood","Willie Nelson","Luke Bryan","Kacey Musgraves","Blake Shelton","George Strait","Reba McEntire","Hank Williams","Loretta Lynn","Kenny Rogers","Alan Jackson","Tim McGraw","Faith Hill","Keith Urban","Miranda Lambert","Chris Stapleton"],
  "corrido": ["Los Tigres del Norte","Chalino Sánchez","Gerardo Ortiz","El Komander","Los Tucanes de Tijuana","Alfredo Olivas","Los Huracanes del Norte","Los Alegres de Terán","Valentín Elizalde","Larry Hernández","El Fantasma","Régulo Caro","Adriel Favela","Calibre 50","Pancho Barraza","Saúl 'El Jaguar'","Remmy Valenzuela","Christian Nodal","Virlan García","Fuerza Regida"],
  "corridosTumbados": ["Peso Pluma","Natanael Cano","Junior H","Fuerza Regida","Gabito Ballesteros","T3R Elemento","Ariel Camacho","Marca Registrada","Tornillo","Oscar Maydon"],
  "cumbia": ["Los Ángeles Azules","La Sonora Dinamita","Los Palmeras","Ráfaga","Gilda","La Nueva Luna","Los Charros","Karicia","Los Mirlos","Lucho Bermúdez","Pastor López","Antonio Ríos","Selva Negra","Agapornis","Mar Azul","Los Totora","Leo Mattioli","Rodrigo Tapari","La Delio Valdez","Damas Gratis"],
  "cumbia420": ["L-Gante","Callejero Fino","Perro Primo","Kaleb Di Masi","DT.Bilardo","Pablo Lescano (colab)","Alan Gomez","La Joaqui","El Noba","Salastkbron","Dj Tao","Bm","Mesita","Keky","Frijo","Zeballos","Ecko","Damas Gratis (feat)","Mágico","TNT"],
  "cumbiaVillera": ["Damas Gratis","Pibes Chorros","Yerba Brava","Mala Fama","Meta Guacha","Amar Azul","Supermerk2","Los Gedes","Flor de Piedra","La Base","La Liga","El Empuje","La Champions Liga","Los del Fuego","Agrupación Marilyn","Altos Cumbieros","Los Nota Lokos","El Polaco","Sebastián Mendoza","El Original"],
  "cuarteto": ["Carlos 'La Mona' Jiménez","Rodrigo","Ulises Bueno","La Barra","Damián Córdoba","El Rey Pelusa","Walter Olmos","Banda XXI","Loco Amato","Sebastián","Tru-la-lá","Chebere","Gary","La Konga","Q' Lokura","Magui Olave","Monada","Jean Carlos","La Fiesta"],
  "dancehall": ["Sean Paul","Shabba Ranks","Beenie Man","Buju Banton","Vybz Kartel","Bounty Killer","Elephant Man","Gyptian","Konshens","Popcaan","Mr. Vegas","Spice","Aidonia","Agent Sasco","T.O.K.","Cham","Mavado","Serani","Koffee","Alkaline"],
  "deathMetal": ["Cannibal Corpse","Death","Morbid Angel","Obituary","Deicide","Behemoth","Entombed","Nile","Bolt Thrower","Carcass","At the Gates","Arch Enemy","Amon Amarth","Katatonia","Hypocrisy","Malevolent Creation","Suffocation","Dying Fetus","Gorguts","Bloodbath"],
  "disco": ["Bee Gees","Donna Summer","Gloria Gaynor","Chic","KC and the Sunshine Band","Village People","Diana Ross","Barry White","Sylvester","The Trammps","ABBA","Sister Sledge","Boney M.","The Jacksons","Hot Chocolate","Amii Stewart","Evelyn 'Champagne' King","Tavares","Patrick Hernandez","The Emotions"],
  "drill": ["Pop Smoke","Central Cee","Headie One","Unknown T","Skepta","Digga D","Gazo","Fredo","Abra Cadabra","Dutchavelli","M1llionz","Loski","LD","21 Savage (influencias)","Lil Durk","Chief Keef","Fivio Foreign","Sheff G","Dusty Locane","King Von"],
  "dubstep": ["Skrillex","Rusko","Excision","Zomboy","Flux Pavilion","Benga","Skream","Doctor P","Knife Party","Virtual Riot","Datsik","Nero","Zeds Dead","Bassnectar","Eptic","Barely Alive","Trampa","Space Laces","Downlink","Snails"],
  "drumAndBass": ["Goldie","Roni Size","Andy C","Noisia","Pendulum","High Contrast","LTJ Bukem","Sub Focus","Netsky","Chase & Status","DJ Hype","Bad Company UK","Calyx & Teebee","Logistics","Danny Byrd","Dimension","Friction","Alix Perez","Break","S.P.Y"],
  "edmActual": ["Martin Garrix","Marshmello","The Chainsmokers","Alan Walker","Zedd","Kygo","Illenium","Madeon","Porter Robinson","Steve Aoki","Hardwell","Oliver Heldens","Alesso","Afrojack","Don Diablo","Dimitri Vegas & Like Mike","David Guetta","Armin van Buuren","Peggy Gou","Subtronics"],
  "folk": ["Bob Dylan","Joan Baez","Simon & Garfunkel","Woody Guthrie","Neil Young","Cat Stevens","Joni Mitchell","Leonard Cohen","Peter, Paul and Mary","Nick Drake","Fairport Convention","The Byrds","Crosby, Stills & Nash","Donovan","James Taylor","Gordon Lightfoot","Odetta","Sufjan Stevens","Fleet Foxes","Iron & Wine"],
  "folkloreArgentino": ["Atahualpa Yupanqui","Mercedes Sosa","Los Chalchaleros","Los Fronterizos","Horacio Guarany","Los Nocheros","Chaqueño Palavecino","Soledad Pastorutti","Abel Pintos","Peteco Carabajal","Los Carabajal","Ramona Galarza","Los Tekis","Jorge Rojas","Los Tucu Tucu","Lucía Ceresani","Raly Barrionuevo","Dúo Coplanacu","Los Huayra","Tamara Castro"],
  "funk": ["James Brown","Parliament-Funkadelic","Prince","Sly & The Family Stone","Rick James","Earth, Wind & Fire","Kool & The Gang","Tower of Power","George Clinton","Bootsy Collins","The Meters","Chic","Cameo","The Gap Band","Ohio Players","Larry Graham","Average White Band","War","Zapp","Shuggie Otis"],
  "glamMetal": ["Mötley Crüe","Poison","Def Leppard","Twisted Sister","Cinderella","Ratt","Warrant","Skid Row","Quiet Riot","Great White"],
  "glamRock": ["David Bowie","T. Rex","Roxy Music","Slade","Sweet","Gary Glitter","New York Dolls","Mott the Hoople","Suzi Quatro","Mud"],
  "gospel": ["Mahalia Jackson","Kirk Franklin","Aretha Franklin","Sister Rosetta Tharpe","Yolanda Adams","Donnie McClurkin","CeCe Winans","Mary Mary","Tasha Cobbs Leonard","Richard Smallwood","Smokie Norful","Shirley Caesar","James Cleveland","Andraé Crouch","Mavis Staples","Travis Greene","Israel Houghton","Fred Hammond","The Clark Sisters","Tamela Mann"],
  "grunge": ["Nirvana","Pearl Jam","Soundgarden","Alice in Chains","Stone Temple Pilots","Mudhoney","Screaming Trees","Temple of the Dog","Mother Love Bone","Bush","Silverchair","Hole","L7","Babes in Toyland","Melvins"],
  "heavyMetal": ["Iron Maiden","Judas Priest","Black Sabbath","Helloween","Manowar","Saxon","Accept","Van Halen","Whitesnake","Dio","Motörhead","Scorpions","Pantera","Metal Church","Yngwie Malmsteen","Stratovarius","Gamma Ray","Iced Earth","Primal Fear","DragonForce","Angra","Nightwish"],
  "heavyMetalArgentino": ["Rata Blanca","Hermética","Almafuerte","V8","Horcas","Malón","Logos","A.N.I.M.A.L.","O'Connor","Lethal"],
  "heavyMetalLatino": ["Kraken","Ángeles del Infierno","Mägo de Oz","Resorte","Transmetal","Luzbel","Barón Rojo","Brujería","Sepultura","Angra"],
  "hiphop": ["Kendrick Lamar","Drake","J. Cole","Jay-Z","Kanye West","Travis Scott","Nicki Minaj","Cardi B","Wu-Tang Clan","Big Daddy Kane","Ice-T","EPMD","MC Hammer","Tyler, The Creator","A$AP Rocky","Run-DMC","LL Cool J","Rakim","Ice Cube","Public Enemy","Outkast","N.W.A.","Lil Wayne","Nas","50 Cent"],
  "highlife": ["E.T. Mensah","Osibisa","Chief Stephen Osita Osadebe","Victor Olaiya","Nana Ampadu","King Sunny Adé (jujú/highlife fusión)","Félá Ransome-Kuti (temprano)","Daddy Lumba","Amakye Dede","Gyedu-Blay Ambolley","Prince Nico Mbarga","Pat Thomas","Fatawu Amadu","Rex Lawson","A.B. Crentsil","Alex Konadu","Sir Victor Uwaifo","Oliver De Coque","Flavour N'abania","Chief Shina Peters"],
  "house": ["Frankie Knuckles","David Guetta","Calvin Harris","Avicii","Swedish House Mafia","Daft Punk","Deadmau5","Eric Prydz","Kaskade","Disclosure","Armand van Helden","Todd Terry","Masters at Work","Cassius","Bob Sinclar","Robin S.","Roger Sanchez","MK (Marc Kinchen)","Duke Dumont","Claptone"],
  "hyperpop": ["100 gecs","Charli XCX","Sophie","Glaive","Dorian Electra","Rina Sawayama","Arca","Midwxst","Osquinn","Food House","Black Dresses","Ericdoa","Alice Longyu Gao","Fraxiom","Quin","Brakence","Ecco2k","Bladee","Yameii Online","Underscores"],
  "indieRock": ["The Strokes","Arctic Monkeys","Vampire Weekend","Franz Ferdinand","The National","Kings of Leon","Tame Impala","Interpol","The White Stripes","Yeah Yeah Yeahs","MGMT","Modest Mouse","The Libertines","Arcade Fire","Phoenix","Two Door Cinema Club","Bloc Party","Foals","The Shins","The Kooks","Death Cab for Cutie","The War on Drugs"],
  "industrialMetal": ["Rammstein","Nine Inch Nails","Ministry","Static-X","Fear Factory","KMFDM","Marilyn Manson","Rob Zombie","Godflesh","Dope","Orgy","Powerman 5000","Pitchshifter","Prong","Skinny Puppy","Oomph!","Stabbing Westward","Celldweller","Filter","Gravity Kills"],
  "jazz": ["Miles Davis","John Coltrane","Louis Armstrong","Duke Ellington","Ella Fitzgerald","Charlie Parker","Billie Holiday","Thelonious Monk","Herbie Hancock","Chet Baker","Sarah Vaughan","Sonny Rollins","Charles Mingus","Dizzy Gillespie","Stan Getz","Wynton Marsalis","Ornette Coleman","Chick Corea","Pat Metheny","Esperanza Spalding"],
  "jpop": ["Hikaru Utada","Perfume","Arashi","Kyary Pamyu Pamyu","Babymetal","Namie Amuro","Ayumi Hamasaki","Morning Musume","X Japan","B'z","L'Arc~en~Ciel","AKB48","King & Prince","Nogizaka46","Gen Hoshino","Ken Hirai","One Ok Rock","RADWIMPS","Mr. Children","SEKAI NO OWARI"],
  "kpop": ["BTS","BLACKPINK","EXO","TWICE","Red Velvet","Stray Kids","SEVENTEEN","NCT 127","ITZY","AESPA","GOT7","TXT","BigBang","Girls' Generation","Super Junior","2NE1","SHINee","LE SSERAFIM","NewJeans","IVE"],
  "latinIndie": ["Zoé","Porter","Siddhartha","Bomba Estéreo","Carla Morrison","Mon Laferte","Hello Seahorse!","Los Amigos Invisibles","El Mató a un Policía Motorizado","Gepe","Dënver","Natalia Lafourcade"],
  "lofi": ["Nujabes","J Dilla","Tomppabeats","Idealism","Joakim Karud","SwuM","Jinsang","L'indécis","FloFilz","Philanthrope","Chillhop Essentials","Saib","Kudasai","Birocratic","Kream","Konteks","Leavv","Aso","Yasper","Oatmello"],
  "mariachi": ["Vicente Fernández","José Alfredo Jiménez","Pedro Infante","Alejandro Fernández","Aida Cuevas","Lucha Villa","Javier Solís","Flor Silvestre","Antonio Aguilar","Pepe Aguilar","Amalia Mendoza","Juan Valentín","Marco Antonio Solís","Ana Gabriel","Mariachi Vargas de Tecalitlán","Mariachi Sol de México","Mariachi Cobre","Christian Nodal","Lucero","Lupita D’Alessio"],
  "merengue": ["Juan Luis Guerra","Johnny Ventura","Sergio Vargas","Milly Quezada","Eddy Herrera","Wilfrido Vargas","Toño Rosario","Elvis Crespo","Omega","Jandy Ventura","Hermanos Rosario","Bonny Cepeda","Kinito Méndez","Rubby Pérez","Rikarena","Fernando Villalona","Miriam Cruz","Pochy Familia","Krisspy","Los Ilegales"],
  "musicaBrasilera": ["Caetano Veloso","Gilberto Gil","Gal Costa","Chico Buarque","Elis Regina","Milton Nascimento","Jorge Ben Jor","Tom Jobim","João Gilberto","Djavan","Maria Bethânia","Ivete Sangalo","Marisa Monte","Zeca Pagodinho","Seu Jorge","Legião Urbana","Os Mutantes","Sepultura","Anitta","Luan Santana"],
  "newWave": ["Duran Duran","A-ha","Tears for Fears","Eurythmics","INXS","Simple Minds","Talking Heads","The B-52's","The Human League","Ultravox"],
  "norteño": ["Ramón Ayala","Los Tucanes de Tijuana","Intocable","Los Huracanes del Norte","Pesado","Bronco","Los Rieleros del Norte","La Maquinaria Norteña","Los Invasores de NL","Los Cadetes de Linares","Los Traileros del Norte","Fito Olivares","La Fiera de Ojinaga","Los Tremendos Gavilanes","Cardenales de NL","Grupo Frontera","Los Temerarios","Duelo","Tigres del Norte (temprano)","Conjunto Primavera"],
  "opera": ["Luciano Pavarotti","Maria Callas","Plácido Domingo","Montserrat Caballé","Andrea Bocelli","Renée Fleming","Jonas Kaufmann","Anna Netrebko","José Carreras","Cecilia Bartoli","Kiri Te Kanawa","Dmitri Hvorostovsky","Bryn Terfel","Jessye Norman","Joan Sutherland","Renata Tebaldi","Franco Corelli","Nicolai Gedda","Elīna Garanča","Piotr Beczała"],
  "pop": ["Michael Jackson","Madonna","Prince","Whitney Houston","Mariah Carey","Janet Jackson","Taylor Swift","Dua Lipa","Ariana Grande","Katy Perry","Lady Gaga","Britney Spears","Christina Aguilera","Ed Sheeran","Bruno Mars","Justin Bieber","Selena Gomez","Shawn Mendes","Billie Eilish","Harry Styles","Olivia Rodrigo"],
  "pop90s": ["Spice Girls","Backstreet Boys","NSYNC","Ricky Martin","Jennifer Lopez","Shakira","Enrique Iglesias","Whitney Houston","Cyndi Lauper","George Michael","Destiny's Child","Hanson"],
  "popLatinoActual": ["Sebastián Yatra","Morat","Tini","Kany García","Carlos Rivera","Fonseca","Sin Bandera","Jesse & Joy","Camilo","Anahí","Maite Perroni","Samo","Leonel García","Lali","Fanny Lu","Sharon Corr (colab latinas)"],
  "popLatinoClasico": ["Luis Miguel","Ricky Martin","Gloria Estefan","Shakira","Enrique Iglesias","Thalía","Paulina Rubio","Chayanne","Alejandro Sanz","Laura Pausini","Ricardo Arjona","Cristian Castro","Marc Anthony","Juanes","Belinda","Natalia Lafourcade","David Bisbal","Reik","Ha*Ash","Camila","Luis Fonsi","Fey","Kabah","OV7","Paty Cantú","Mecano","Hombres G","Vanessa Martín","Pablo Alborán","Axel","Pedro Capó","Coti","Amaia Montero","Eros Ramazzotti (colab en español)","Rosana","Ednita Nazario","Soledad Pastorutti (pop/folk fusión)"],
  "popPunk": ["Blink-182","Green Day","Paramore","My Chemical Romance","Sum 41","Avril Lavigne","Fall Out Boy","Good Charlotte","Simple Plan","All Time Low"],
  "progressiveRock": ["Pink Floyd","Genesis","Yes","King Crimson","Rush","Dream Theater","ELP","Jethro Tull","Camel","Marillion","Porcupine Tree","Gentle Giant","Kansas","Transatlantic","Arena","IQ","Asia","Opeth","Neal Morse Band","Steven Wilson"],
  "punk": ["Ramones","Sex Pistols","The Clash","Dead Kennedys","Misfits","Buzzcocks","The Damned","Black Flag","Bad Religion","Descendents","NOFX","Rancid","Green Day","The Offspring","Pennywise","Anti-Flag","Dropkick Murphys","The Exploited","Lagwagon","Fugazi"],
  "ranchera": ["Javier Solís","Lucha Villa","Pedro Infante","Pepe Aguilar","Amalia Mendoza","Antonio Aguilar","Vicente Fernández","Chavela Vargas","José Alfredo Jiménez","Cuco Sánchez","Aida Cuevas","Jorge Negrete","Lola Beltrán","Ana Gabriel","Alejandro Fernández","Pedro Fernández","Lucero","Luis Miguel","Marco Antonio Solís","Juan Gabriel"],
  "rap": ["Eminem","Nas","Tupac","The Notorious B.I.G.","Lil Wayne","Ice Cube","Run-DMC","Rakim","Snoop Dogg","Jay-Z","Big L","DMX","J. Cole","Kendrick Lamar","Busta Rhymes","Big Pun","KRS-One","Tech N9ne","Killer Mike","Mos Def"],
  "rb": ["Beyoncé","Rihanna","Usher","Alicia Keys","The Weeknd","Chris Brown","Mary J. Blige","SZA","Frank Ocean","Miguel","Ne-Yo","Trey Songz","Ciara","Brandy","Monica","Toni Braxton","Boyz II Men","Tyrese","Janelle Monáe","H.E.R."],
  "reggae": ["Bob Marley","Peter Tosh","Jimmy Cliff","Burning Spear","Toots & The Maytals","Ziggy Marley","Damian Marley","Gregory Isaacs","Steel Pulse","Black Uhuru","Dennis Brown","Buju Banton","Shabba Ranks","Sean Paul","Chronixx","Protoje","Alborosie","Capleton","Yellowman","Sizzla"],
  "reggaeton": ["Daddy Yankee","J Balvin","Karol G","Ozuna","Nicky Jam","Maluma","Feid","Rauw Alejandro","Anuel AA","Wisin & Yandel","Chencho Corleone","Ivy Queen","Don Omar","Farruko","Arcángel","De La Ghetto","Sech","Bryant Myers","Lunay","Tego Calderón"],
  "rock": ["The Beatles","The Rolling Stones","Led Zeppelin","KISS","Santana","Creedence Clearwater Revival","Pink Floyd","Queen","The Who","AC/DC","Guns N' Roses","Aerosmith","U2","The Doors","Deep Purple","Bon Jovi","Pearl Jam","Radiohead","Coldplay","The Police","Dire Straits","Red Hot Chili Peppers"],
  "rockArgentino": ["Soda Stereo","Charly García","Luis Alberto Spinetta","Fito Páez","Patricio Rey y sus Redonditos de Ricota","Andrés Calamaro","Los Fabulosos Cadillacs","Divididos","Babasónicos","Los Auténticos Decadentes","Rata Blanca","Los Pericos","La Renga","Bersuit Vergarabat","Los Enanitos Verdes","Virus","Sumo","Los Tipitos","Catupecu Machu","Attaque 77","León Gieco","Pedro Aznar","David Lebón","Serú Girán","Los Abuelos de la Nada","Ratones Paranoicos","Todos Tus Muertos","Kapanga","Massacre","Carajo"],
  "rockLatino": ["Maná","Soda Stereo","Caifanes","Los Fabulosos Cadillacs","Molotov","Héroes del Silencio","Enanitos Verdes","Aterciopelados","Los Prisioneros","Café Tacuba","La Ley","Fito Páez","Charly García","Andrés Calamaro","Bersuit Vergarabat","La Renga","Divididos","Babasónicos","Rata Blanca","Los Auténticos Decadentes"],
  "salsa": ["Celia Cruz","Héctor Lavoe","Rubén Blades","Marc Anthony","Willie Colón","Oscar D’León","Tito Puente","Johnny Pacheco","Ismael Rivera","Ray Barretto","Cheo Feliciano","Eddie Palmieri","Larry Harlow","Pete 'El Conde' Rodríguez","Adalberto Santiago","Charlie Palmieri","Frankie Ruiz","La India","Víctor Manuelle","Gilberto Santa Rosa"],
  "sambaPagode": ["Cartola","Noel Rosa","Zeca Pagodinho","Beth Carvalho","Clara Nunes","Paulinho da Viola","Martinho da Vila","Fundo de Quintal","Jorge Aragão","Alcione","Arlindo Cruz","Dudu Nobre","Pixinguinha","Nelson Cavaquinho","Bezerra da Silva","Grupo Revelación","Exaltasamba","Só Pra Contrariar","Raça Negra","Turma do Pagode"],
  "ska": ["The Specials","Madness","Toots & The Maytals","Desmond Dekker","The Skatalites","The Selecter","Bad Manners","Hepcat","The Toasters","Reel Big Fish","Less Than Jake","The Mighty Mighty Bosstones","The Slackers","Operation Ivy","Streetlight Manifesto","Fishbone","Prince Buster","Laurel Aitken","Alton Ellis","Eastern Standard Time"],
  "softRock": ["Eagles","Fleetwood Mac","Boston","Chicago","America","Styx","Supertramp","Toto","Phil Collins","Lionel Richie","Journey","REO Speedwagon"],
  "soul": ["Aretha Franklin","Otis Redding","Marvin Gaye","Stevie Wonder","Ray Charles","Sam Cooke","Smokey Robinson","Al Green","Curtis Mayfield","Gladys Knight","The Temptations","Diana Ross","Tina Turner","James Brown","Isaac Hayes","Barry White","Solomon Burke","Patti LaBelle","Donny Hathaway","Erykah Badu"],
  "synthpop": ["Depeche Mode","Pet Shop Boys","New Order","CHVRCHES","Grimes","Erasure","Owl City","La Roux","Empire of the Sun","M83"],
  "tango": ["Carlos Gardel","Astor Piazzolla","Aníbal Troilo","Osvaldo Pugliese","Juan D’Arienzo","Roberto Goyeneche","Edmundo Rivero","Horacio Salgán","Mercedes Simone","Francisco Canaro","Nelly Omar","Hugo del Carril","Adolfo Carabelli","Enrique Santos Discépolo","Julio Sosa","Adriana Varela","Susana Rinaldi","Jorge Sobral","Leopoldo Federico","Orquesta Típica Fernández Fierro"],
  "techno": ["Carl Cox","Jeff Mills","Richie Hawtin","Adam Beyer","Charlotte de Witte","Amelie Lens","Sven Väth","Laurent Garnier","Nina Kraviz","Derrick May","Juan Atkins","Kevin Saunderson","Len Faki","Ben Klock","Marcel Dettmann","Dave Clarke","Green Velvet","Dubfire","Chris Liebing","Joseph Capriati"],
  "thrashMetal": ["Metallica","Slayer","Megadeth","Anthrax","Exodus","Testament","Machine Head","Overkill","Sepultura","Kreator","Sodom","Destruction","Vio-Lence","Havok","Heathen","Annihilator","Death Angel","Forbidden","Municipal Waste","Tankard","Sacred Reich"],
  "trance": ["Armin van Buuren","Paul van Dyk","Tiesto","Ferry Corsten","Above & Beyond","ATB","Dash Berlin","Aly & Fila","Cosmic Gate","Paul Oakenfold","BT","Gareth Emery","Markus Schulz","Giuseppe Ottaviani","Andrew Rayel","MaRLo","Orjan Nilsen","Lange","Johan Gielen","Sander van Doorn"],
  "trovaCubana": ["Silvio Rodríguez","Pablo Milanés","Noel Nicola","Sara González","Vicente Feliú","Amaury Pérez","Frank Delgado","Carlos Varela","Gerardo Alfonso","Santiago Feliú","Liuba María Hevia","Polito Ibáñez","Kelvis Ochoa","Tony Ávila","Pedro Luis Ferrer","Carlos Mejía Godoy","Vicentico Valdés","Virulo","Marta Campos","Karel García"],
  "trap": ["Bad Bunny","Anuel AA","Travis Scott","Future","Migos","Lil Baby","21 Savage","Young Thug","Playboi Carti","Lil Uzi Vert","Offset","Kodak Black","Roddy Ricch","DaBaby","Don Toliver","Ski Mask the Slump God","Gunna","NAV","Trippie Redd","YBN Nahmir"],
  "trapArgentino": ["Duki","Bizarrap","YSY A","Cazzu","Nicki Nicole","Trueno","Khea","Tiago PZK","Neo Pistea","Lit Killah","Ecko","Paulo Londra","Papo MC","Replik","Wos","FMK","Rusherking","Seven Kayne","C.R.O","Bhavi"],
  "urbanoLatino": ["Bad Bunny","Karol G","Rauw Alejandro","Feid","Mora","Sech","Myke Towers","Natti Natasha","Becky G","Zion & Lennox","Anuel AA","Ozuna","Young Miko","María Becerra","Rels B","Lali","Tini","Micro TDH","Nathy Peluso","Jhayco","Kali Uchis"]
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