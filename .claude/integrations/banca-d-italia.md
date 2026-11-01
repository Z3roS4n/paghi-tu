# Banca d’Italia — debito delle amministrazioni pubbliche

> **Ultimo aggiornamento:** 31 ottobre 2026 · **da:** Codex (su mandato Giovanni)

## Contratto
Download pubblico senza autenticazione né variabili d’ambiente; nessun SDK o webhook. `scripts/data/fetch-public-finance.ts` esegue GET `https://a2a.bancaditalia.it/infostat/dataservices/export/IT/CSV/DATA/PUBLICATION/BANKITALIA/DIFF/FPI` e riceve un archivio ZIP contenente `TCCE0325_IT.zip`. Estrae il CSV TCCE0325 in `data/raw/bancaditalia/TCCE0325.csv`; il manifest registra URL, data e SHA-256. Nessuna richiesta inviata durante questa correzione documentale.

`build-public-finance.ts` usa il debito lordo totale mensile in milioni di euro e confronta il dato di dicembre con Eurostat. Il sito legge soltanto lo snapshot JSON. Copertura, fonte e avvertenze pubblicate seguono i dati importati, non questa scheda.

## Errori e recupero
HTTP non 2xx o archivio non leggibile fanno fallire il download; un controllo contabile fallito interrompe la trasformazione. La routine deve mantenere l’ultimo snapshot valido, registrare il fallimento e segnalarlo al titolare con il meccanismo già previsto da D-018. Nessun fallback a valori inventati e nessun retry parallelo. Nessuna chiave o tariffa a consumo configurata; nessun costo misurato in questa verifica. Licenza e riuso: registro fonti del progetto.
