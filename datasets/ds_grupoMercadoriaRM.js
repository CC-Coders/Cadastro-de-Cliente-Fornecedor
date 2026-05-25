function createDataset(fields, constraints, sortFields) {

    var dataset = DatasetBuilder.newDataset();

    dataset.addColumn("CODGRUPO");
    dataset.addColumn("DESCRICAO");

    var conn = null;
    var stmt = null;
    var rs = null;

    try {
        var ic = new javax.naming.InitialContext();
        var ds = ic.lookup("/jdbc/RM");

        conn = ds.getConnection();
        stmt = conn.createStatement();

        // Retorna todos os grupos de mercadoria com código e descrição
        var sql =
            "SELECT CODGRUPO, DESCRICAO " +
            "FROM TTB2 " +
            "ORDER BY DESCRICAO";

        rs = stmt.executeQuery(sql);

        while (rs.next()) {
            dataset.addRow([
                rs.getString("CODGRUPO"),
                rs.getString("DESCRICAO")
            ]);
        }

    } catch (e) {
        dataset.addRow(["ERRO", e.toString()]);

    } finally {
        try {
            if (rs != null) rs.close();
            if (stmt != null) stmt.close();
            if (conn != null) conn.close();
        } catch (e) {
            dataset.addRow(["ERRO_CLOSE", e.toString()]);
        }
    }

    return dataset;
}
