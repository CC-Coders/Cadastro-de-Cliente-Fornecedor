// Dataset: ds_irrfRM
// Retorna todos os registros da tabela FIRRF incluindo PESSOAFISOUJUR.
// A filtragem por tipo (F/J/A) é feita no lado cliente (Functions.js → _popularSelectIrrf).
// Padrão idêntico ao ds_paisRM.js (createStatement + executeQuery(sql) + getString por nome).

function createDataset(fields, constraints, sortFields) {

    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("CODRECEITA");
    dataset.addColumn("DESCRICAO");
    dataset.addColumn("ALIQUOTA");
    dataset.addColumn("PESSOAFISOUJUR");

    var conn  = null;
    var stmt  = null;
    var rs    = null;

    try {
        var ic = new javax.naming.InitialContext();
        var ds = ic.lookup("/jdbc/RM");

        conn = ds.getConnection();
        stmt = conn.createStatement();

        var sql = "SELECT CODRECEITA, DESCRICAO, ALIQUOTA, PESSOAFISOUJUR " +
                  "FROM FIRRF " +
                  "ORDER BY DESCRICAO";

        rs = stmt.executeQuery(sql);

        while (rs.next()) {
            dataset.addRow([
                rs.getString("CODRECEITA"),
                rs.getString("DESCRICAO"),
                rs.getString("ALIQUOTA"),
                rs.getString("PESSOAFISOUJUR")
            ]);
        }

    } catch (e) {
        dataset.addRow(["ERRO", e.toString(), "0", ""]);

    } finally {
        try { if (rs   != null) rs.close();   } catch (ex) {}
        try { if (stmt != null) stmt.close(); } catch (ex) {}
        try { if (conn != null) conn.close(); } catch (ex) {}
    }

    return dataset;
}
