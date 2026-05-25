function createDataset(fields, constraints, sortFields) {

    var dataset = DatasetBuilder.newDataset();

    dataset.addColumn("NUMBANCO");
    dataset.addColumn("NOME");

    var conn = null;
    var stmt = null;
    var rs = null;

    try {
        var ic = new javax.naming.InitialContext();
        var ds = ic.lookup("/jdbc/RM");

        conn = ds.getConnection();
        stmt = conn.createStatement();

        // Retorna todos os bancos com código (NUMBANCO) e nome
        var sql =
            "SELECT NUMBANCO, NOME " +
            "FROM GBANCO " +
            "ORDER BY NOME";

        rs = stmt.executeQuery(sql);

        while (rs.next()) {
            dataset.addRow([
                rs.getString("NUMBANCO"),
                rs.getString("NOME")
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
